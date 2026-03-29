package com.example.saasportal.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val LightColorScheme = lightColorScheme(
    primary = Blue700,
    onPrimary = White,
    primaryContainer = LightBlue100,
    onPrimaryContainer = Blue800,
    secondary = Blue500,
    onSecondary = White,
    secondaryContainer = LightBlue50,
    onSecondaryContainer = Blue800,
    background = Gray50,
    onBackground = Gray900,
    surface = White,
    onSurface = Gray900,
    surfaceVariant = Gray100,
    onSurfaceVariant = Gray600,
    error = Red700,
    onError = White,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    outline = Gray400,
)

private val DarkColorScheme = darkColorScheme(
    primary = LightBlue100,
    onPrimary = Blue800,
    primaryContainer = Blue700,
    onPrimaryContainer = LightBlue50,
    secondary = LightBlue100,
    onSecondary = Blue800,
    background = Gray900,
    onBackground = Gray100,
    surface = Gray800,
    onSurface = Gray100,
    surfaceVariant = Gray800,
    onSurfaceVariant = Gray200,
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    outline = Gray600,
)

@Composable
fun SaaSPortalTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content,
    )
}
