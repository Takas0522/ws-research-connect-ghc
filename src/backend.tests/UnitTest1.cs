namespace backend.tests;

public class WeatherForecastTests
{
    [Fact]
    public void TemperatureF_ConvertsCorrectly()
    {
        var forecast = new WeatherForecast(DateOnly.FromDateTime(DateTime.Now), 0, "Cold");
        Assert.Equal(32, forecast.TemperatureF);
    }

    [Theory]
    [InlineData(100, 211)]
    [InlineData(-40, -39)]
    public void TemperatureF_KnownValues(int celsius, int expectedFahrenheit)
    {
        var forecast = new WeatherForecast(DateOnly.FromDateTime(DateTime.Now), celsius, null);
        Assert.Equal(expectedFahrenheit, forecast.TemperatureF);
    }
}
