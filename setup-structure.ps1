# Remove old structure
Remove-Item -Path "src" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "public" -Recurse -Force -ErrorAction SilentlyContinue

# Create directory structure
$directories = @(
    "public",
    "src\components\FormBuilder",
    "src\components\Responses", 
    "src\components\Common",
    "src\pages",
    "src\services",
    "src\utils",
    "src\styles\components\FormBuilder",
    "src\styles\components\Responses",
    "src\styles\components\Common",
    "src\styles\pages"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir
}

# Create all files
$files = @(
    "public\index.html",
    "src\components\FormBuilder\FormList.jsx",
    "src\components\FormBuilder\FormEditor.jsx",
    "src\components\FormBuilder\SectionEditor.jsx",
    "src\components\FormBuilder\QuestionEditor.jsx",
    "src\components\FormBuilder\QuestionPreview.jsx",
    "src\components\Responses\ResponseViewer.jsx",
    "src\components\Common\Button.jsx",
    "src\components\Common\Input.jsx",
    "src\components\Common\Modal.jsx",
    "src\components\Common\LoadingSpinner.jsx",
    "src\pages\AdminDashboard.jsx",
    "src\pages\FormEditorPage.jsx",
    "src\pages\ResponsesPage.jsx",
    "src\services\api.js",
    "src\services\formService.js",
    "src\services\responseService.js",
    "src\utils\constants.js",
    "src\utils\helpers.js",
    "src\styles\components\FormBuilder\FormList.css",
    "src\styles\components\FormBuilder\FormEditor.css",
    "src\styles\components\FormBuilder\SectionEditor.css",
    "src\styles\components\FormBuilder\QuestionEditor.css",
    "src\styles\components\FormBuilder\QuestionPreview.css",
    "src\styles\components\Responses\ResponseViewer.css",
    "src\styles\components\Common\Button.css",
    "src\styles\components\Common\Input.css",
    "src\styles\components\Common\Modal.css",
    "src\styles\components\Common\LoadingSpinner.css",
    "src\styles\pages\AdminDashboard.css",
    "src\styles\pages\FormEditorPage.css",
    "src\styles\pages\ResponsesPage.css",
    "src\styles\index.css",
    "src\styles\variables.css",
    "src\styles\global.css",
    "src\styles\App.css",
    "src\App.jsx",
    "src\index.js",
    ".env",
    "tailwind.config.js",
    "package.json",
    "README.md"
)

foreach ($file in $files) {
    New-Item -ItemType File -Force -Path $file
}

Write-Host "Structure created successfully!" -ForegroundColor Green
