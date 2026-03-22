import { useEffect, useState } from "react";

interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string | null;
}

function App() {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/weatherforecast")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setForecasts)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Research Connect
        </h1>
        <p className="mt-2 text-gray-600">
          Frontend (React + Tailwind) / Backend (ASP.NET Core) / Database (PostgreSQL)
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Weather Forecast (API テスト)
        </h2>
        {error && (
          <p className="mb-4 text-red-600">
            API エラー: {error}
          </p>
        )}
        {forecasts.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="pb-2">Date</th>
                <th className="pb-2">Temp (°C)</th>
                <th className="pb-2">Temp (°F)</th>
                <th className="pb-2">Summary</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f) => (
                <tr key={f.date} className="border-b last:border-0">
                  <td className="py-2">{f.date}</td>
                  <td className="py-2">{f.temperatureC}</td>
                  <td className="py-2">{f.temperatureF}</td>
                  <td className="py-2">{f.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !error && <p className="text-gray-400">Loading...</p>
        )}
      </section>
    </div>
  );
}

export default App;
