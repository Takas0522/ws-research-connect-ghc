using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Logging.Console;
using Microsoft.Extensions.Options;

namespace M365CommunicationApp.Services.Logging;

/// <summary>
/// メッセージ本文のみを出力するコンソールフォーマッタ。
/// CLI の見た目を Console.WriteLine 時代と同等に維持する。
/// </summary>
public sealed class MinimalConsoleFormatter : ConsoleFormatter
{
    public MinimalConsoleFormatter(IOptionsMonitor<ConsoleFormatterOptions> options)
        : base("minimal")
    {
    }

    public override void Write<TState>(
        in LogEntry<TState> logEntry,
        IExternalScopeProvider? scopeProvider,
        TextWriter textWriter)
    {
        var message = logEntry.Formatter?.Invoke(logEntry.State, logEntry.Exception);
        if (message == null) return;

        textWriter.WriteLine(message);

        if (logEntry.Exception != null)
            textWriter.WriteLine(logEntry.Exception.ToString());
    }
}
