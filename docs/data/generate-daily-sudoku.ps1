# Daily Sudoku CDN Data Generator
# 生成每日数独数据，每组保证唯一解

function Solve-Sudoku {
    param([array]$board)
    
    for ($i = 0; $i -lt 9; $i++) {
        for ($j = 0; $j -lt 9; $j++) {
            if ($board[$i][$j] -eq 0) {
                # 行、列、宫已有的数字
                $used = @{}
                for ($k = 0; $k -lt 9; $k++) {
                    if ($board[$i][$k] -ne 0) { $used[$board[$i][$k]] = $true }
                    if ($board[$k][$j] -ne 0) { $used[$board[$k][$j]] = $true }
                }
                $boxRow = [Math]::Floor($i / 3) * 3
                $boxCol = [Math]::Floor($j / 3) * 3
                for ($bi = 0; $bi -lt 3; $bi++) {
                    for ($bj = 0; $bj -lt 3; $bj++) {
                        if ($board[$boxRow + $bi][$boxCol + $bj] -ne 0) {
                            $used[$board[$boxRow + $bi][$boxCol + $bj]] = $true
                        }
                    }
                }
                
                $nums = @(1..9) | Get-Random -Count 9
                foreach ($n in $nums) {
                    if (-not $used.ContainsKey($n)) {
                        $board[$i][$j] = $n
                        if (Solve-Sudoku $board) { return $true }
                        $board[$i][$j] = 0
                    }
                }
                return $false
            }
        }
    }
    return $true
}

function Get-FullBoard {
    # 生成一个完整的数独终局
    $board = @(0..8 | ForEach-Object { ,@(0..8 | ForEach-Object { 0 }) })
    Solve-Sudoku $board
    return $board
}

function Test-UniqueSolution {
    param([array]$puzzle)
    
    $solutionCount = 0
    $firstSolution = $null
    
    function Solve-Count {
        param([array]$b, [int]$count)
        
        if ($count.count -gt 1) { return }
        
        for ($i = 0; $i -lt 9; $i++) {
            for ($j = 0; $j -lt 9; $j++) {
                if ($b[$i][$j] -eq 0) {
                    $used = @{}
                    for ($k = 0; $k -lt 9; $k++) {
                        if ($b[$i][$k] -ne 0) { $used[$b[$i][$k]] = $true }
                        if ($b[$k][$j] -ne 0) { $used[$b[$k][$j]] = $true }
                    }
                    $boxRow = [Math]::Floor($i / 3) * 3
                    $boxCol = [Math]::Floor($j / 3) * 3
                    for ($bi = 0; $bi -lt 3; $bi++) {
                        for ($bj = 0; $bj -lt 3; $bj++) {
                            if ($b[$boxRow + $bi][$boxCol + $bj] -ne 0) {
                                $used[$b[$boxRow + $bi][$boxCol + $bj]] = $true
                            }
                        }
                    }
                    
                    $nums = @(1..9)
                    foreach ($n in $nums) {
                        if (-not $used.ContainsKey($n)) {
                            $b[$i][$j] = $n
                            Solve-Count $b $count
                            $b[$i][$j] = 0
                            if ($count.count -gt 1) { return }
                        }
                    }
                    return
                }
            }
        }
        $count[0]++
        if ($null -eq $firstSolution) {
            $script:firstSolution = ,@($b | ForEach-Object { ,@($_ ) })
        }
    }
    
    $bCopy = $puzzle | ForEach-Object { ,@($_ ) }
    $count = @(0)
    Solve-Count $bCopy $count
    return $count[0], $firstSolution
}

function Remove-Numbers {
    param(
        [array]$solution,
        [int]$removeCount
    )
    
    # 创建谜题副本
    $puzzle = $solution | ForEach-Object { ,@($_ ) }
    
    # 生成所有格子位置并随机打乱
    $positions = @()
    for ($i = 0; $i -lt 81; $i++) { $positions += $i }
    $positions = $positions | Get-Random -Count 81
    
    $removed = 0
    foreach ($pos in $positions) {
        if ($removed -ge $removeCount) { break }
        
        $row = [Math]::Floor($pos / 9)
        $col = $pos % 9
        $savedValue = $puzzle[$row][$col]
        $puzzle[$row][$col] = 0
        
        # 检查是否仍有唯一解
        $result = Test-UniqueSolution $puzzle
        if ($result[0] -eq 1) {
            $removed++
        } else {
            # 恢复数字
            $puzzle[$row][$col] = $savedValue
        }
    }
    
    return $puzzle
}

function Get-DifficultyLevel {
    param([int]$givenCount)
    
    if ($givenCount -ge 46) { return @{ name = "入门"; stars = "★☆☆☆☆"; level = "easy" } }
    elseif ($givenCount -ge 38) { return @{ name = "简单"; stars = "★★☆☆☆"; level = "medium" } }
    elseif ($givenCount -ge 32) { return @{ name = "中等"; stars = "★★★☆☆"; level = "hard" } }
    elseif ($givenCount -ge 26) { return @{ name = "困难"; stars = "★★★★☆"; level = "expert" } }
    else { return @{ name = "骨灰"; stars = "★★★★★"; level = "master" } }
}

function New-DailySudoku {
    param([int]$dayOfYear)
    
    # 根据日期确定难度种子（每天固定难度）
    $seed = $dayOfYear * 7
    $givenMin = 28
    $givenMax = 50
    $targetGiven = $givenMin + ($seed % ($givenMax - $givenMin + 1))
    $removeCount = 81 - $targetGiven
    
    $maxAttempts = 20
    for ($attempt = 0; $attempt -lt $maxAttempts; $attempt++) {
        Write-Host "  尝试 $attempt ... " -NoNewline
        
        # 生成完整解
        $solution = Get-FullBoard
        
        # 挖洞
        $puzzle = Remove-Numbers $solution $removeCount
        
        # 验证唯一解
        $result = Test-UniqueSolution $puzzle
        
        if ($result[0] -eq 1) {
            # 统计给数字数量
            $givenCount = 0
            for ($i = 0; $i -lt 9; $i++) {
                for ($j = 0; $j -lt 9; $j++) {
                    if ($puzzle[$i][$j] -ne 0) { $givenCount++ }
                }
            }
            
            $difficulty = Get-DifficultyLevel $givenCount
            
            Write-Host "成功！给数字: $givenCount" -ForegroundColor Green
            
            return @{
                puzzle = $puzzle
                solution = $result[1]
                givenCount = $givenCount
                difficulty = $difficulty
            }
        }
        
        Write-Host "失败(非唯一解)" -ForegroundColor Yellow
    }
    
    Write-Host "  最终尝试..." -NoNewline
    $solution = Get-FullBoard
    $puzzle = Remove-Numbers $solution (81 - 35)
    $result = Test-UniqueSolution $puzzle
    
    $givenCount = 0
    for ($i = 0; $i -lt 9; $i++) {
        for ($j = 0; $j -lt 9; $j++) {
            if ($puzzle[$i][$j] -ne 0) { $givenCount++ }
        }
    }
    $difficulty = Get-DifficultyLevel $givenCount
    
    Write-Host "OK" -ForegroundColor Yellow
    
    return @{
        puzzle = $puzzle
        solution = $result[1]
        givenCount = $givenCount
        difficulty = $difficulty
    }
}

# ========== 主程序 ==========
Write-Host "===== 每日数独数据生成器 =====" -ForegroundColor Cyan
Write-Host ""

$days = 30  # 生成30天（一个月）
Write-Host "将生成 $days 天的数独数据..." -ForegroundColor Yellow
Write-Host ""

$puzzles = @()

for ($day = 1; $day -le $days; $day++) {
    $date = (Get-Date).Date.AddDays($day - 1)
    $dateStr = $date.ToString("yyyy-MM-dd")
    $dayOfYear = $date.DayOfYear
    
    Write-Host "[$day/$days] $dateStr (第$dayOfYear天)" -ForegroundColor Cyan
    $result = New-DailySudoku $dayOfYear
    
    $puzzles += @{
        date = $dateStr
        dayOfYear = $dayOfYear
        name = "$($date.Month)月$($date.Day)日"
        difficulty = $result.difficulty.name
        level = $result.difficulty.stars
        difficultyKey = $result.difficulty.level
        givenCount = $result.givenCount
        puzzle = $result.puzzle
        solution = $result.solution
    }
}

# 构建输出
$output = @{
    version = "1.0.0"
    updateDate = (Get-Date).ToString("yyyy-MM-dd")
    description = "每日数独数据，每天一题，保证唯一解"
    totalDays = $puzzles.Count
    puzzles = $puzzles
}

# 输出JSON
$json = $output | ConvertTo-Json -Depth 10
$json | Out-File -FilePath "F:\selfjob\freetools\docs\data\daily-sudoku.json" -Encoding UTF8

Write-Host ""
Write-Host "===== 生成完成 =====" -ForegroundColor Cyan
Write-Host "文件: F:\selfjob\freetools\docs\data\daily-sudoku.json" -ForegroundColor Green
Write-Host "共 $($puzzles.Count) 组数独" -ForegroundColor Yellow

# 统计
$easy = ($puzzles | Where-Object { $_.difficultyKey -eq "easy" }).Count
$medium = ($puzzles | Where-Object { $_.difficultyKey -eq "medium" }).Count
$hard = ($puzzles | Where-Object { $_.difficultyKey -eq "hard" }).Count
$expert = ($puzzles | Where-Object { $_.difficultyKey -eq "expert" }).Count
$master = ($puzzles | Where-Object { $_.difficultyKey -eq "master" }).Count

Write-Host ""
Write-Host "难度分布:" -ForegroundColor White
Write-Host "  入门: $easy" -ForegroundColor Green
Write-Host "  简单: $medium" -ForegroundColor Green
Write-Host "  中等: $hard" -ForegroundColor Yellow
Write-Host "  困难: $expert" -ForegroundColor Orange
Write-Host "  骨灰: $master" -ForegroundColor Red
