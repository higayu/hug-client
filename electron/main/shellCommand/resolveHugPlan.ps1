$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
[Console]::InputEncoding = New-Object Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)

function New-Result($Success, $Code, $Message, $TargetUrl = "", $LoginRequired = $false) {
  [ordered]@{ success=[bool]$Success; code=$Code; message=$Message; targetUrl=$TargetUrl; loginRequired=[bool]$LoginRequired; cookies=@() }
}
function Test-LoginPage($Html) {
  $Html -match 'name\s*=\s*["'']username["'']' -or $Html -match 'ログインしていません'
}
function Get-Attribute($Tag, $Name) {
  $m = [regex]::Match($Tag, ([regex]::Escape($Name) + '\s*=\s*(["''])(.*?)\1'), 'IgnoreCase')
  if ($m.Success) { [Net.WebUtility]::HtmlDecode($m.Groups[2].Value) } else { $null }
}
function Get-AbsoluteUrl($Href, $BaseUrl) {
  ([Uri]::new([Uri]$BaseUrl, [Net.WebUtility]::HtmlDecode($Href))).AbsoluteUri
}
function Stop-With($Value) { $script:result = $Value; throw "HANDLED" }
function Get-QueryId($Href, $BaseUrl) {
  $absolute = Get-AbsoluteUrl $Href $BaseUrl
  # HUG plan IDs are numeric. Never allow trailing HTML to become part of the ID.
  $match = [regex]::Match(([Uri]$absolute).Query, '(?:^|[?&])id=(\d+)(?:&|$)', 'IgnoreCase')
  if ($match.Success) { [Uri]::UnescapeDataString($match.Groups[1].Value) } else { $null }
}
function Resolve-IndividualPlanUrl($Request, $WebSession, $BaseUrl) {
  if (-not $Request.facilityId) { Stop-With (New-Result $false 'FACILITY_ID_MISSING' '個別支援計画の検索に必要なfacilityIdが指定されていません') }
  $facilityId = [string]$Request.facilityId
  if ($facilityId -notmatch '^\d+$') { Stop-With (New-Result $false 'INVALID_FACILITY_ID' 'facilityIdが不正です') }
  $postData = @{
    ("f_ary[{0}]" -f $facilityId) = $facilityId
    c_id = [string]$Request.childId
    indivisual_format = 'careplanmain'
    state = '1'
    mode = 'search'
  }
  $listUrl = $BaseUrl + 'individual_situation.php'
  $response = Invoke-WebRequest $listUrl -Method Post -Body $postData -WebSession $WebSession -UseBasicParsing
  if (Test-LoginPage $response.Content) { Stop-With (New-Result $false 'SESSION_EXPIRED' '個別支援計画の検索中にHUGセッションが失効しました') }
  $table = [regex]::Match($response.Content, '<div\b(?=[^>]*class\s*=\s*["''][^"'']*\bindividualSituation\b)[^>]*>.*?<table\b[^>]*>(.*?)</table>', 'IgnoreCase,Singleline')
  if (-not $table.Success) { Stop-With (New-Result $false 'INDIVIDUAL_PLAN_TABLE_NOT_FOUND' '個別支援計画の一覧テーブルが見つかりません') }
  $link = [regex]::Match($table.Value, '<tbody\b[^>]*>\s*<tr\b[^>]*>.*?<td\b(?=[^>]*class\s*=\s*["''][^"'']*\bpor\b)[^>]*>\s*<a\b[^>]*href\s*=\s*(["''])(.*?)\1', 'IgnoreCase,Singleline')
  if (-not $link.Success) { Stop-With (New-Result $false 'INDIVIDUAL_PLAN_NOT_FOUND' '一覧の先頭行に個別支援計画書のリンクが見つかりません') }
  $id = Get-QueryId $link.Groups[2].Value $BaseUrl
  if (-not $id) { Stop-With (New-Result $false 'INDIVIDUAL_PLAN_ID_NOT_FOUND' '個別支援計画書のIDを取得できませんでした') }
  $BaseUrl + 'individual_care-plan-main.php?mode=detail&id=' + [Uri]::EscapeDataString($id)
}
function Resolve-SpecializedPlanUrl($Request, $WebSession, $BaseUrl) {
  $listUrl = $BaseUrl + 'addition_plan_situation.php?mode=list&c_id=' + [Uri]::EscapeDataString([string]$Request.childId)
  $response = Invoke-WebRequest $listUrl -WebSession $WebSession -UseBasicParsing
  if (Test-LoginPage $response.Content) { Stop-With (New-Result $false 'SESSION_EXPIRED' '専門的支援計画の検索中にHUGセッションが失効しました') }
  $table = [regex]::Match($response.Content, '<div\b(?=[^>]*class\s*=\s*["''][^"'']*\bindividualSituation\b)[^>]*>.*?<table\b(?=[^>]*class\s*=\s*["''][^"'']*\btable\b)[^>]*>(.*?)</table>', 'IgnoreCase,Singleline')
  if (-not $table.Success) { Stop-With (New-Result $false 'SPECIALIZED_PLAN_TABLE_NOT_FOUND' '専門支援計画の一覧テーブルが見つかりません') }
  # Match fetchProfessionalPlan: find an <i> whose normalized text is exactly 公開,
  # then use the href of that element's closest enclosing <a>.
  $publishedHref = $null
  foreach ($anchor in [regex]::Matches($table.Value, '<a\b[^>]*>(?:(?!</a>).)*?</a>', 'IgnoreCase,Singleline')) {
    $openingTag = [regex]::Match($anchor.Value, '^<a\b[^>]*>', 'IgnoreCase').Value
    $href = Get-Attribute $openingTag 'href'
    if (-not $href) { continue }
    foreach ($icon in [regex]::Matches($anchor.Value, '<i\b[^>]*>(.*?)</i>', 'IgnoreCase,Singleline')) {
      $iconText = [Net.WebUtility]::HtmlDecode([regex]::Replace($icon.Groups[1].Value, '<[^>]+>', '')).Trim()
      if ($iconText -ceq '公開') { $publishedHref = $href; break }
    }
    if ($publishedHref) { break }
  }
  if (-not $publishedHref) { Stop-With (New-Result $false 'PUBLISHED_SPECIALIZED_PLAN_NOT_FOUND' '公開中の専門支援計画が見つかりません') }
  $id = Get-QueryId $publishedHref $BaseUrl
  if (-not $id) { Stop-With (New-Result $false 'SPECIALIZED_PLAN_ID_NOT_FOUND' '専門支援計画のIDを取得できませんでした') }
  $BaseUrl + 'addition_plan.php?mode=detail&id=' + [Uri]::EscapeDataString($id)
}

$result = New-Result $false 'UNKNOWN' '不明なエラーです'
try {
  $request = ([Console]::In.ReadToEnd() | ConvertFrom-Json)
  $baseUrl = 'https://www.hug-ayumu.link/hug/wm/'
  $webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  foreach ($cookie in @($request.cookies)) {
    $c = New-Object Net.Cookie($cookie.name, $cookie.value, $(if ($cookie.path) {$cookie.path} else {'/'}), 'www.hug-ayumu.link')
    $c.Secure = [bool]$cookie.secure; $c.HttpOnly = [bool]$cookie.httpOnly
    $webSession.Cookies.Add($c)
  }
  $loginPage = Invoke-WebRequest $baseUrl -WebSession $webSession -UseBasicParsing
  $didLogin = $false
  if (Test-LoginPage $loginPage.Content) {
    if (-not $request.username -or -not $request.password) { Stop-With (New-Result $false 'CREDENTIALS_MISSING' 'HUGセッションが無効で、config.jsonに認証情報がありません' '' $true) }
    $csrfTag = [regex]::Match($loginPage.Content, '<input\b(?=[^>]*\bname\s*=\s*["'']csrf_token_from_client["''])[^>]*>', 'IgnoreCase').Value
    $csrf = Get-Attribute $csrfTag 'value'
    if (-not $csrf) { Stop-With (New-Result $false 'CSRF_NOT_FOUND' 'ログイン用CSRFトークンを取得できませんでした' '' $true) }
    $body = @{mode='login_pass';mode_token='nomode';csrf_token_from_client=$csrf;hug_page_url='index.php';username=$request.username;password=$request.password}
    $login = Invoke-WebRequest $baseUrl -Method Post -Body $body -WebSession $webSession -UseBasicParsing
    if (Test-LoginPage $login.Content) { Stop-With (New-Result $false 'LOGIN_FAILED' 'HUGへのログインに失敗しました' '' $true) }
    $didLogin = $true
  }

  if ($request.pageType -eq 'specialized') { $target = Resolve-SpecializedPlanUrl $request $webSession $baseUrl }
  elseif ($request.pageType -eq 'individual') { $target = Resolve-IndividualPlanUrl $request $webSession $baseUrl }
  else { Stop-With (New-Result $false 'INVALID_PAGE_TYPE' '未対応の支援計画種別です') }
  $result=New-Result $true 'OK' '対象URLを取得しました' $target $didLogin
  $result.childId=[string]$request.childId
  $result.cookies=@($webSession.Cookies.GetCookies([Uri]'https://www.hug-ayumu.link/')|%{[ordered]@{name=$_.Name;value=$_.Value;path=$_.Path;secure=$_.Secure;httpOnly=$_.HttpOnly;expires=$(if($_.Expires -gt [DateTime]::MinValue){([DateTimeOffset]$_.Expires).ToUnixTimeSeconds()}else{$null})}})
} catch {
  if ($_.Exception.Message -ne 'HANDLED') { $result=New-Result $false 'POWERSHELL_ERROR' $_.Exception.Message }
}
[Console]::Out.Write(($result|ConvertTo-Json -Depth 5 -Compress))
