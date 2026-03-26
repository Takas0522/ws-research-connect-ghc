package com.example.saasportal.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.saasportal.R
import com.example.saasportal.ui.auth.AuthViewModel
import com.example.saasportal.ui.auth.LoginScreen
import com.example.saasportal.ui.auth.SignUpScreen
import com.example.saasportal.ui.services.ServiceDetailScreen
import com.example.saasportal.ui.services.ServiceListScreen
import com.example.saasportal.ui.settings.SettingsScreen

object Routes {
    const val LOGIN = "login"
    const val SIGNUP = "signup"
    const val MAIN = "main"
    const val DASHBOARD = "dashboard"
    const val SERVICES = "services"
    const val SERVICE_DETAIL = "services/{serviceCode}"
    const val SETTINGS = "settings"

    fun serviceDetail(serviceCode: String): String = "services/$serviceCode"
}

enum class BottomNavItem(
    val route: String,
    val icon: ImageVector,
    val labelResId: Int,
    val testTag: String,
) {
    DASHBOARD(
        route = Routes.DASHBOARD,
        icon = Icons.Default.Dashboard,
        labelResId = R.string.dashboard_tab,
        testTag = "bottom_nav_dashboard",
    ),
    SERVICES(
        route = Routes.SERVICES,
        icon = Icons.Default.Apps,
        labelResId = R.string.services_tab,
        testTag = "bottom_nav_services",
    ),
    SETTINGS(
        route = Routes.SETTINGS,
        icon = Icons.Default.Settings,
        labelResId = R.string.settings_tab,
        testTag = "bottom_nav_settings",
    ),
}

@Composable
fun SaaSPortalNavHost(
    authViewModel: AuthViewModel = hiltViewModel(),
) {
    val isLoggedIn by authViewModel.isLoggedIn.collectAsStateWithLifecycle()
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = if (isLoggedIn) Routes.MAIN else Routes.LOGIN,
    ) {
        composable(Routes.LOGIN) {
            LoginScreen(
                viewModel = authViewModel,
                onNavigateToSignUp = {
                    navController.navigate(Routes.SIGNUP)
                },
                onLoginSuccess = {
                    navController.navigate(Routes.MAIN) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.SIGNUP) {
            SignUpScreen(
                viewModel = authViewModel,
                onNavigateToLogin = {
                    navController.popBackStack()
                },
                onSignUpSuccess = {
                    navController.navigate(Routes.MAIN) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.MAIN) {
            MainScreen(
                onLogout = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.MAIN) { inclusive = true }
                    }
                },
            )
        }
    }
}

@Composable
private fun MainScreen(
    onLogout: () -> Unit,
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    Scaffold(
        bottomBar = {
            NavigationBar(
                modifier = Modifier.testTag("bottom_navigation_bar"),
            ) {
                BottomNavItem.entries.forEach { item ->
                    NavigationBarItem(
                        icon = {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = stringResource(item.labelResId),
                            )
                        },
                        label = { Text(stringResource(item.labelResId)) },
                        selected = currentDestination?.hierarchy?.any {
                            it.route == item.route
                        } == true,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        modifier = Modifier.testTag(item.testTag),
                    )
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.DASHBOARD,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(Routes.DASHBOARD) {
                PlaceholderScreen(
                    title = "ダッシュボード",
                    testTag = "dashboard_heading",
                )
            }
            composable(Routes.SERVICES) {
                ServiceListScreen(
                    onServiceClick = { serviceCode ->
                        navController.navigate(Routes.serviceDetail(serviceCode))
                    },
                )
            }
            composable(
                route = Routes.SERVICE_DETAIL,
                arguments = listOf(
                    navArgument("serviceCode") { type = NavType.StringType },
                ),
            ) {
                ServiceDetailScreen(
                    onNavigateBack = { navController.popBackStack() },
                )
            }
            composable(Routes.SETTINGS) {
                SettingsScreen(onLogout = onLogout)
            }
        }
    }
}

@Composable
private fun PlaceholderScreen(
    title: String,
    testTag: String,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.testTag(testTag),
        )
    }
}
