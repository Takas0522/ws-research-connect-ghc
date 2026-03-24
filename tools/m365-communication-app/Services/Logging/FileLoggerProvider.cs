using Microsoft.Extensions.Logging;

namespace M365CommunicationApp.Services.Logging;

/// <summary>
/// タイムスタンプ付きでログをファイルに出力するプロバイダー
/// </summary>
public sealed class FileLoggerProvider : ILoggerProvider
{
    private readonly StreamWriter _writer;
    private readonly LogLevel _minLevel;
    private readonly object _lock = new();

    public string FilePath { get; }

    public FileLoggerProvider(string logDirectory, LogLevel minLevel = LogLevel.Debug)
    {
        Directory.CreateDirectory(logDirectory);
        var fileName = $"m365-comm-{DateTime.Now:yyyyMMdd-HHmmss}.log";
        FilePath = Path.GetFullPath(Path.Combine(logDirectory, fileName));
        _writer = new StreamWriter(FilePath, append: true, System.Text.Encoding.UTF8)
        {
            AutoFlush = true
        };
        _minLevel = minLevel;
    }

    public ILogger CreateLogger(string categoryName) =>
        new FileLogger(categoryName, _writer, _minLevel, _lock);

    public void Dispose() => _writer.Dispose();
}

internal sealed class FileLogger : ILogger
{
    private readonly string _category;
    private readonly StreamWriter _writer;
    private readonly LogLevel _minLevel;
    private readonly object _lock;

    public FileLogger(string category, StreamWriter writer, LogLevel minLevel, object lockObj)
    {
        // カテゴリ名を短縮（最後のドット以降のクラス名のみ）
        var lastDot = category.LastIndexOf('.');
        _category = lastDot >= 0 ? category[(lastDot + 1)..] : category;
        _writer = writer;
        _minLevel = minLevel;
        _lock = lockObj;
    }

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) => logLevel >= _minLevel;

    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state,
        Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel)) return;

        var message = formatter(state, exception);
        if (string.IsNullOrEmpty(message) && exception == null) return;

        var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
        var level = logLevel switch
        {
            LogLevel.Trace => "TRC",
            LogLevel.Debug => "DBG",
            LogLevel.Information => "INF",
            LogLevel.Warning => "WRN",
            LogLevel.Error => "ERR",
            LogLevel.Critical => "CRI",
            _ => "???"
        };

        lock (_lock)
        {
            _writer.WriteLine($"{timestamp} [{level}] [{_category}] {message}");
            if (exception != null)
                _writer.WriteLine(exception.ToString());
        }
    }
}
