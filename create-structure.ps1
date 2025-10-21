# Save as create-structure.ps1 and run in frontend-vite directory
Write-Host "Creating complete frontend structure for Vite..." -ForegroundColor Green

# Create all directories
$directories = @(
    "src\components\FormBuilder",
    "src\components\Shared",
    "src\components\Layout",
    "src\components\Auth",
    "src\pages",
    "src\services",
    "src\utils",
    "src\hooks",
    "src\context",
    "src\styles\components\formBuilder",
    "src\styles\components\shared",
    "src\styles\components\layout",
    "src\styles\components\pages",
    "src\styles\base",
    "src\styles\utilities",
    "src\assets\images",
    "src\assets\icons"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

Write-Host "Directories created" -ForegroundColor Green

# Create all files
$files = @(
    "src\components\Auth\Login.jsx",
    "src\components\Auth\Register.jsx",
    "src\components\Auth\ProtectedRoute.jsx",
    "src\components\FormBuilder\FormList.jsx",
    "src\components\FormBuilder\FormCard.jsx",
    "src\components\FormBuilder\CreateForm.jsx",
    "src\components\FormBuilder\FormConfig.jsx",
    "src\components\FormBuilder\FormLayout.jsx",
    "src\components\FormBuilder\InputFieldPanel.jsx",
    "src\components\FormBuilder\FormHeader.jsx",
    "src\components\FormBuilder\PublishModal.jsx",
    "src\components\FormBuilder\DeleteModal.jsx",
    "src\components\FormBuilder\QuestionCard.jsx",
    "src\components\Shared\Button.jsx",
    "src\components\Shared\Modal.jsx",
    "src\components\Shared\Tabs.jsx",
    "src\components\Shared\SearchBar.jsx",
    "src\components\Shared\LoadingSpinner.jsx",
    "src\components\Shared\Toast.jsx",
    "src\components\Shared\EmptyState.jsx",
    "src\components\Shared\Input.jsx",
    "src\components\Shared\Select.jsx",
    "src\components\Shared\Textarea.jsx",
    "src\components\Layout\Header.jsx",
    "src\components\Layout\Sidebar.jsx",
    "src\components\Layout\Layout.jsx",
    "src\pages\LoginPage.jsx",
    "src\pages\RegisterPage.jsx",
    "src\pages\FormBuilderPage.jsx",
    "src\pages\CreateFormPage.jsx",
    "src\pages\ResponsesPage.jsx",
    "src\pages\SubmitFormPage.jsx",
    "src\pages\NotFoundPage.jsx",
    "src\services\api.js",
    "src\services\authService.js",
    "src\services\formService.js",
    "src\services\responseService.js",
    "src\utils\constants.js",
    "src\utils\helpers.js",
    "src\utils\validators.js",
    "src\utils\storage.js",
    "src\hooks\useAuth.js",
    "src\hooks\useForm.js",
    "src\hooks\useToast.js",
    "src\hooks\useLocalStorage.js",
    "src\context\AuthContext.jsx",
    "src\context\FormContext.jsx",
    "src\context\ToastContext.jsx"
)

foreach ($file in $files) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

Write-Host "Files created" -ForegroundColor Green

# Create .env.example
$envExample = @"
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Form Builder
VITE_ENABLE_RESPONSES=true
VITE_MAX_FILE_SIZE=5242880
"@
Set-Content -Path ".env.example" -Value $envExample

# Create .env if it doesn't exist
if (!(Test-Path .env)) {
    Set-Content -Path ".env" -Value $envExample
    Write-Host ".env file created" -ForegroundColor Green
}

# Create jsconfig.json
$jsconfig = @'
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@pages/*": ["pages/*"],
      "@services/*": ["services/*"],
      "@utils/*": ["utils/*"],
      "@hooks/*": ["hooks/*"],
      "@context/*": ["context/*"],
      "@styles/*": ["styles/*"],
      "@assets/*": ["assets/*"]
    }
  },
  "include": ["src"]
}
'@
Set-Content -Path "jsconfig.json" -Value $jsconfig

# Update vite.config.js
$viteConfig = @'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
'@
Set-Content -Path "vite.config.js" -Value $viteConfig

Write-Host "Configuration files created" -ForegroundColor Green
Write-Host "Complete structure created successfully!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npm install' to ensure all dependencies are installed" -ForegroundColor White
Write-Host "2. Copy component code into respective files" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the Vite development server" -ForegroundColor White
Write-Host "The app will run on http://localhost:3000" -ForegroundColor Cyan
