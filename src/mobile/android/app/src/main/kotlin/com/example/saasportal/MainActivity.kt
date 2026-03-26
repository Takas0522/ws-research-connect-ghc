package com.example.saasportal

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.saasportal.ui.navigation.SaaSPortalNavHost
import com.example.saasportal.ui.theme.SaaSPortalTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SaaSPortalTheme {
                SaaSPortalNavHost()
            }
        }
    }
}
