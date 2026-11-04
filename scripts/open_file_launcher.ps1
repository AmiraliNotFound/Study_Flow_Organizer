param (
    [Parameter(Mandatory = $true)]
    [string]$RawUri
)

try {
    # 1. Strip protocol prefix (openfile:///, openfile://, openfile:)
    $cleanPath = $RawUri -replace '^openfile:/*',''
    
    # 2. URL decode
    $cleanPath = [System.Uri]::UnescapeDataString($cleanPath)
    
    # 3. Clean up quotes and whitespace
    $cleanPath = $cleanPath.Trim('"').Trim("'").Trim()
    
    $repoDir = Split-Path $PSScriptRoot -Parent
    if (!$repoDir) { $repoDir = $PSScriptRoot }
    $appDir = Join-Path $repoDir "app"

    # Handle pick-file action
    if ($cleanPath -match '^(pick-file|select-file)') {
        Add-Type -AssemblyName System.Windows.Forms
        $dialog = New-Object System.Windows.Forms.OpenFileDialog
        $dialog.Title = "Select Course Material File"
        $dialog.Filter = "All Files (*.*)|*.*|PDF Documents (*.pdf)|*.pdf|Video Files (*.mp4;*.mkv;*.mov;*.avi)|*.mp4;*.mkv;*.mov;*.avi|Office Documents (*.docx;*.pptx;*.xlsx)|*.docx;*.pptx;*.xlsx"
        $dialog.RestoreDirectory = $true
        
        $topForm = New-Object System.Windows.Forms.Form
        $topForm.TopMost = $true
        $topForm.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen

        if ($dialog.ShowDialog($topForm) -eq [System.Windows.Forms.DialogResult]::OK) {
            $path = $dialog.FileName
            $name = [System.IO.Path]::GetFileName($path)
            $ext = [System.IO.Path]::GetExtension($path).TrimStart('.').ToLower()
            
            # Copy to clipboard
            try { Set-Clipboard -Value $path } catch {}
            
            # Write JS callback file for browser pickup in both app and root
            $escapedPath = $path.Replace('\', '\\').Replace('"', '\"')
            $escapedName = $name.Replace('\', '\\').Replace('"', '\"')
            $ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            $jsCode = "window.__onMaterialPicked && window.__onMaterialPicked({ path: ""$escapedPath"", name: ""$escapedName"", ext: ""$ext"", isFolder: false, timestamp: $ts });"
            
            $appJsPath = Join-Path $appDir "picked_material.js"
            [System.IO.File]::WriteAllText($appJsPath, $jsCode, [System.Text.Encoding]::UTF8)
            $rootJsPath = Join-Path $repoDir "picked_material.js"
            [System.IO.File]::WriteAllText($rootJsPath, $jsCode, [System.Text.Encoding]::UTF8)
        }
        exit 0
    }

    # Handle pick-folder action
    if ($cleanPath -match '^(pick-folder|select-folder)') {
        Add-Type -AssemblyName System.Windows.Forms
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $dialog.Description = "Select Course Material Folder"
        $dialog.ShowNewFolderButton = $true
        
        $topForm = New-Object System.Windows.Forms.Form
        $topForm.TopMost = $true
        $topForm.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen

        if ($dialog.ShowDialog($topForm) -eq [System.Windows.Forms.DialogResult]::OK) {
            $path = $dialog.SelectedPath
            $name = Split-Path $path -Leaf
            if (!$name) { $name = $path }
            
            # Copy to clipboard
            try { Set-Clipboard -Value $path } catch {}
            
            # Write JS callback file for browser pickup in both app and root
            $escapedPath = $path.Replace('\', '\\').Replace('"', '\"')
            $escapedName = $name.Replace('\', '\\').Replace('"', '\"')
            $ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            $jsCode = "window.__onMaterialPicked && window.__onMaterialPicked({ path: ""$escapedPath"", name: ""$escapedName"", ext: ""folder"", isFolder: true, timestamp: $ts });"
            
            $appJsPath = Join-Path $appDir "picked_material.js"
            [System.IO.File]::WriteAllText($appJsPath, $jsCode, [System.Text.Encoding]::UTF8)
            $rootJsPath = Join-Path $repoDir "picked_material.js"
            [System.IO.File]::WriteAllText($rootJsPath, $jsCode, [System.Text.Encoding]::UTF8)
        }
        exit 0
    }

    # Handle automated git-push action
    if ($cleanPath -match '^git-push') {
        $msg = "Update subjects and academic schedule"
        if ($cleanPath -match 'msg=([^&]+)') {
            $msg = [System.Uri]::UnescapeDataString($matches[1])
        }
        Push-Location $repoDir
        try {
            git add -A
            $null = git commit -m "$msg" 2>&1
            $pushOut = git push origin main 2>&1 | Out-String
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.MessageBox]::Show("Successfully pushed updates to GitHub!`n`nRepository: https://github.com/sinasharifi-7462/Study_Flow_Organizer`nBranch: main`nCommit: $msg`n`nOutput:`n$pushOut", "Study Flow - GitHub Sync", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
        } catch {
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.MessageBox]::Show("Git Push encountered an error:`n$_", "Study Flow - GitHub Sync Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
        } finally {
            Pop-Location
        }
        exit 0
    }

    # Handle launch-git-dashboard action
    if ($cleanPath -match '^launch-git-dashboard') {
        $batPath = Join-Path $repoDir "Push_To_GitHub.bat"
        if (Test-Path $batPath) {
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$batPath`""
        }
        exit 0
    }

    # Handle launch-git-pull action
    if ($cleanPath -match '^launch-git-pull') {
        $batPath = Join-Path $repoDir "Pull_From_GitHub.bat"
        if (Test-Path $batPath) {
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$batPath`""
        }
        exit 0
    }

    # 4. Normalize Windows drive path (e.g. D:/something -> D:\something)
    if ($cleanPath -match '^/?([a-zA-Z]:)(.*)') {
        $cleanPath = $matches[1] + ($matches[2] -replace '/', '\')
    }
    
    # 5. Open file or folder with native Windows program (Foxit Reader for PDF, Explorer for folder)
    if (Test-Path -LiteralPath $cleanPath) {
        $procInfo = New-Object System.Diagnostics.ProcessStartInfo
        $procInfo.FileName = $cleanPath
        $procInfo.UseShellExecute = $true
        [System.Diagnostics.Process]::Start($procInfo) | Out-Null
    } else {
        # Fallback start attempt
        Start-Process -FilePath $cleanPath -ErrorAction SilentlyContinue
    }
} catch {
    # Show error if file cannot be launched
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show("Could not launch file or folder:`n$cleanPath`n`nError: $_", "Study Flow Launcher")
}
