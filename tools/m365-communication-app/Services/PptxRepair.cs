using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;
using DocumentFormat.OpenXml.Validation;
using D = DocumentFormat.OpenXml.Drawing;

namespace M365CommunicationApp.Services;

/// <summary>
/// OpenXMLで生成されたPowerPointファイルの構造を検証・修復するユーティリティ。
/// AIが生成するスクリプトはTheme/ColorMap/SlideMaster等を省略しがちなため、
/// 実行後に自動修復を行い、PowerPoint/Teams/SharePointで開けるファイルにする。
/// </summary>
public static class PptxRepair
{
    /// <summary>
    /// 指定ディレクトリ内の全.pptxファイルを検証し、必要に応じて修復する。
    /// </summary>
    public static List<string> RepairAll(string directory)
    {
        var repaired = new List<string>();
        foreach (var file in Directory.GetFiles(directory, "*.pptx", SearchOption.AllDirectories))
        {
            if (Repair(file))
                repaired.Add(file);
        }
        return repaired;
    }

    /// <summary>
    /// PPTXファイルをバリデーションし、エラー一覧を返す。
    /// </summary>
    public static List<string> Validate(string filePath)
    {
        var errors = new List<string>();
        try
        {
            using var doc = PresentationDocument.Open(filePath, false);
            var validator = new OpenXmlValidator();
            foreach (var e in validator.Validate(doc))
            {
                errors.Add($"{e.Part?.Uri}: {e.Description}");
            }
        }
        catch (Exception ex)
        {
            errors.Add($"ファイルを開けません: {ex.Message}");
        }
        return errors;
    }

    /// <summary>
    /// 指定ディレクトリ内の全.pptxファイルをバリデーションし、ファイル名→エラー一覧のマップを返す。
    /// </summary>
    public static Dictionary<string, List<string>> ValidateAll(string directory)
    {
        var results = new Dictionary<string, List<string>>();
        foreach (var file in Directory.GetFiles(directory, "*.pptx", SearchOption.AllDirectories))
        {
            var errors = Validate(file);
            if (errors.Count > 0)
                results[Path.GetFileName(file)] = errors;
        }
        return results;
    }

    /// <summary>
    /// 単一のPPTXファイルを検証・修復する。修復が行われた場合trueを返す。
    /// </summary>
    public static bool Repair(string filePath)
    {
        try
        {
            using var doc = PresentationDocument.Open(filePath, true);
            var presentationPart = doc.PresentationPart;
            if (presentationPart == null) return false;

            var modified = false;

            // 0. 全スライドの Shape 内 txBody 名前空間を修正
            //    AIは Drawing.TextBody (a:txBody) を使いがちだが、
            //    Shape 内では Presentation.TextBody (p:txBody) が必要
            modified |= FixTextBodyNamespace(presentationPart);

            // 1. ThemePart が欠けている場合は追加
            if (presentationPart.ThemePart == null)
            {
                var themePart = presentationPart.AddNewPart<ThemePart>();
                themePart.Theme = CreateDefaultTheme();
                modified = true;
            }

            // 2. SlideMasterPart が欠けている場合は追加
            if (!presentationPart.SlideMasterParts.Any())
            {
                var slideMasterPart = presentationPart.AddNewPart<SlideMasterPart>();
                slideMasterPart.AddPart(presentationPart.ThemePart!);

                var slideLayoutPart = slideMasterPart.AddNewPart<SlideLayoutPart>();
                slideLayoutPart.SlideLayout = new SlideLayout(
                    new CommonSlideData(new ShapeTree(
                        CreateGroupShapeNonVisualProps(),
                        new GroupShapeProperties(new D.TransformGroup())))
                ) { Type = SlideLayoutValues.Title };

                slideMasterPart.SlideMaster = new SlideMaster(
                    new CommonSlideData(new ShapeTree(
                        CreateGroupShapeNonVisualProps(),
                        new GroupShapeProperties(new D.TransformGroup()))),
                    CreateDefaultColorMap(),
                    new SlideLayoutIdList(
                        new SlideLayoutId
                        {
                            Id = 2147483649,
                            RelationshipId = slideMasterPart.GetIdOfPart(slideLayoutPart)
                        })
                );

                // 各スライドにSlideLayoutが欠けていれば追加
                foreach (var slidePart in presentationPart.SlideParts)
                {
                    if (slidePart.SlideLayoutPart == null)
                        slidePart.AddPart(slideLayoutPart);
                }

                // Presentation要素を正しい順序で再構築
                RebuildPresentation(presentationPart, slideMasterPart);
                modified = true;
            }
            else
            {
                // SlideMaster は存在するがColorMapが欠けている場合
                foreach (var smp in presentationPart.SlideMasterParts)
                {
                    if (smp.SlideMaster?.GetFirstChild<ColorMap>() == null)
                    {
                        // ColorMapをCommonSlideDataの直後に挿入
                        var csd = smp.SlideMaster?.GetFirstChild<CommonSlideData>();
                        if (csd != null)
                        {
                            smp.SlideMaster!.InsertAfter(CreateDefaultColorMap(), csd);
                            modified = true;
                        }
                    }

                    // ThemePartの参照が欠けている場合
                    if (!smp.GetPartsOfType<ThemePart>().Any() && presentationPart.ThemePart != null)
                    {
                        smp.AddPart(presentationPart.ThemePart);
                        modified = true;
                    }
                }

                // SlideLayoutが欠けているスライドを修復
                var anyLayout = presentationPart.SlideMasterParts
                    .SelectMany(m => m.SlideLayoutParts)
                    .FirstOrDefault();

                if (anyLayout != null)
                {
                    foreach (var slidePart in presentationPart.SlideParts)
                    {
                        if (slidePart.SlideLayoutPart == null)
                        {
                            slidePart.AddPart(anyLayout);
                            modified = true;
                        }
                    }
                }

                // SlideMasterIdList が欠けている場合の修復
                if (presentationPart.Presentation.SlideMasterIdList == null)
                {
                    RebuildPresentation(presentationPart, presentationPart.SlideMasterParts.First());
                    modified = true;
                }
            }

            // SlideSize / NotesSize が欠けている場合
            if (presentationPart.Presentation.SlideSize == null)
            {
                presentationPart.Presentation.Append(
                    new SlideSize { Cx = 12192000, Cy = 6858000 });
                modified = true;
            }
            if (presentationPart.Presentation.GetFirstChild<NotesSize>() == null)
            {
                presentationPart.Presentation.Append(
                    new NotesSize { Cx = 6858000, Cy = 9144000 });
                modified = true;
            }

            if (modified)
                presentationPart.Presentation.Save();

            return modified;
        }
        catch
        {
            // ファイルが根本的に壊れている場合はスキップ
            return false;
        }
    }

    /// <summary>
    /// 全スライドの Shape 内で Drawing名前空間の txBody (a:txBody) → Presentation名前空間の txBody (p:txBody) に変換する。
    /// AIが DocumentFormat.OpenXml.Drawing.TextBody を使うミスを修正する。
    /// OpenXMLバリデータはこれを OpenXmlUnknownElement として扱うため、型チェックではなくタグ名で検索する。
    /// </summary>
    private static bool FixTextBodyNamespace(PresentationPart presentationPart)
    {
        const string drawingNs = "http://schemas.openxmlformats.org/drawingml/2006/main";
        const string presNs = "http://schemas.openxmlformats.org/presentationml/2006/main";
        var modified = false;

        foreach (var slidePart in presentationPart.SlideParts)
        {
            var shapeTree = slidePart.Slide?.CommonSlideData?.ShapeTree;
            if (shapeTree == null) continue;

            var slideModified = false;
            foreach (var shape in shapeTree.Elements<Shape>())
            {
                // Drawing名前空間の txBody は OpenXmlUnknownElement として格納される
                var badTxBody = shape.ChildElements
                    .OfType<OpenXmlUnknownElement>()
                    .FirstOrDefault(e => e.LocalName == "txBody" && e.NamespaceUri == drawingNs);

                if (badTxBody == null) continue;

                // 内部XMLを保持したまま Presentation名前空間の TextBody に書き換え
                var innerXml = badTxBody.InnerXml;
                var newXml = $"<p:txBody xmlns:p=\"{presNs}\" xmlns:a=\"{drawingNs}\">{innerXml}</p:txBody>";
                var newElement = new TextBody(newXml);
                shape.ReplaceChild(newElement, badTxBody);
                slideModified = true;
            }

            if (slideModified)
            {
                slidePart.Slide!.Save();
                modified = true;
            }
        }

        return modified;
    }

    private static void RebuildPresentation(
        PresentationPart presentationPart,
        SlideMasterPart slideMasterPart)
    {
        var pres = presentationPart.Presentation;

        // 既存の要素を削除
        pres.RemoveAllChildren<SlideMasterIdList>();
        pres.RemoveAllChildren<SlideIdList>();
        pres.RemoveAllChildren<SlideSize>();
        pres.RemoveAllChildren<NotesSize>();

        // 正しい順序で再追加: SlideMasterIdList → SlideIdList → SlideSize → NotesSize
        var masterIdList = new SlideMasterIdList(
            new SlideMasterId
            {
                Id = 2147483648,
                RelationshipId = presentationPart.GetIdOfPart(slideMasterPart)
            });

        var slideIdList = new SlideIdList();
        uint slideId = 256;
        foreach (var slidePart in presentationPart.SlideParts)
        {
            slideIdList.Append(new SlideId
            {
                Id = slideId++,
                RelationshipId = presentationPart.GetIdOfPart(slidePart)
            });
        }

        // PrependChild で先頭から順に追加
        pres.PrependChild(new NotesSize { Cx = 6858000, Cy = 9144000 });
        pres.PrependChild(new SlideSize { Cx = 12192000, Cy = 6858000 });
        pres.PrependChild(slideIdList);
        pres.PrependChild(masterIdList);
    }

    private static D.Theme CreateDefaultTheme() =>
        new(new D.ThemeElements(
            new D.ColorScheme(
                new D.Dark1Color(new D.SystemColor { Val = D.SystemColorValues.WindowText }),
                new D.Light1Color(new D.SystemColor { Val = D.SystemColorValues.Window }),
                new D.Dark2Color(new D.RgbColorModelHex { Val = "44546A" }),
                new D.Light2Color(new D.RgbColorModelHex { Val = "E7E6E6" }),
                new D.Accent1Color(new D.RgbColorModelHex { Val = "4472C4" }),
                new D.Accent2Color(new D.RgbColorModelHex { Val = "ED7D31" }),
                new D.Accent3Color(new D.RgbColorModelHex { Val = "A5A5A5" }),
                new D.Accent4Color(new D.RgbColorModelHex { Val = "FFC000" }),
                new D.Accent5Color(new D.RgbColorModelHex { Val = "5B9BD5" }),
                new D.Accent6Color(new D.RgbColorModelHex { Val = "70AD47" }),
                new D.Hyperlink(new D.RgbColorModelHex { Val = "0563C1" }),
                new D.FollowedHyperlinkColor(new D.RgbColorModelHex { Val = "954F72" })
            ) { Name = "Office" },
            new D.FontScheme(
                new D.MajorFont(
                    new D.LatinFont { Typeface = "Calibri Light" },
                    new D.EastAsianFont { Typeface = "Yu Gothic Light" },
                    new D.ComplexScriptFont { Typeface = "" }),
                new D.MinorFont(
                    new D.LatinFont { Typeface = "Calibri" },
                    new D.EastAsianFont { Typeface = "Yu Gothic" },
                    new D.ComplexScriptFont { Typeface = "" })
            ) { Name = "Office" },
            new D.FormatScheme(
                new D.FillStyleList(
                    new D.SolidFill(new D.SchemeColor { Val = D.SchemeColorValues.PhColor }),
                    new D.SolidFill(new D.SchemeColor { Val = D.SchemeColorValues.PhColor }),
                    new D.SolidFill(new D.SchemeColor { Val = D.SchemeColorValues.PhColor })),
                new D.LineStyleList(
                    new D.Outline(new D.SolidFill(new D.SchemeColor { Val = D.SchemeColorValues.PhColor })),
                    new D.Outline(new D.SolidFill(new D.SchemeColor { Val = D.SchemeColorValues.PhColor })),
                    new D.Outline(new D.SolidFill(new D.SchemeColor { Val = D.SchemeColorValues.PhColor }))),
                new D.EffectStyleList(
                    new D.EffectStyle(new D.EffectList()),
                    new D.EffectStyle(new D.EffectList()),
                    new D.EffectStyle(new D.EffectList())),
                new D.BackgroundFillStyleList(
                    new D.SolidFill(new D.SchemeColor { Val = D.SchemeColorValues.PhColor }),
                    new D.SolidFill(new D.SchemeColor { Val = D.SchemeColorValues.PhColor }),
                    new D.SolidFill(new D.SchemeColor { Val = D.SchemeColorValues.PhColor }))
            ) { Name = "Office" }
        )) { Name = "Office Theme" };

    private static ColorMap CreateDefaultColorMap() =>
        new()
        {
            Background1 = D.ColorSchemeIndexValues.Light1,
            Text1 = D.ColorSchemeIndexValues.Dark1,
            Background2 = D.ColorSchemeIndexValues.Light2,
            Text2 = D.ColorSchemeIndexValues.Dark2,
            Accent1 = D.ColorSchemeIndexValues.Accent1,
            Accent2 = D.ColorSchemeIndexValues.Accent2,
            Accent3 = D.ColorSchemeIndexValues.Accent3,
            Accent4 = D.ColorSchemeIndexValues.Accent4,
            Accent5 = D.ColorSchemeIndexValues.Accent5,
            Accent6 = D.ColorSchemeIndexValues.Accent6,
            Hyperlink = D.ColorSchemeIndexValues.Hyperlink,
            FollowedHyperlink = D.ColorSchemeIndexValues.FollowedHyperlink
        };

    private static NonVisualGroupShapeProperties CreateGroupShapeNonVisualProps() =>
        new(new NonVisualDrawingProperties { Id = 1, Name = "" },
            new NonVisualGroupShapeDrawingProperties(),
            new ApplicationNonVisualDrawingProperties());
}
