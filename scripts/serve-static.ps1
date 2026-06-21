param(
  [string]$Root = ".",
  [int]$Port = 8789
)

$ErrorActionPreference = "Stop"
$resolvedRoot = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Root).Path)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)
$listener.Server.SetSocketOption(
  [System.Net.Sockets.SocketOptionLevel]::Socket,
  [System.Net.Sockets.SocketOptionName]::ReuseAddress,
  $true
)
$listener.Start()

function Get-Content-Type([string]$Path) {
  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".css" { "text/css; charset=utf-8"; break }
    ".js" { "application/javascript; charset=utf-8"; break }
    ".json" { "application/json; charset=utf-8"; break }
    ".png" { "image/png"; break }
    ".jpg" { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".svg" { "image/svg+xml"; break }
    default { "application/octet-stream" }
  }
}

function Send-Response($Stream, [int]$Status, [string]$Reason, [byte[]]$Body, [string]$ContentType) {
  $header = "HTTP/1.1 $Status $Reason`r`nContent-Length: $($Body.Length)`r`nContent-Type: $ContentType`r`nConnection: close`r`nCache-Control: no-store`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $client.ReceiveTimeout = 3000
    $client.SendTimeout = 3000
    $stream = $client.GetStream()
    $buffer = New-Object byte[] 8192
    $read = $stream.Read($buffer, 0, $buffer.Length)
    if ($read -le 0) { continue }
    $request = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read)
    $firstLine = ($request -split "`r?`n")[0]
    $parts = $firstLine -split " "
    if ($parts.Length -lt 2 -or $parts[0] -ne "GET") {
      Send-Response $stream 405 "Method Not Allowed" ([System.Text.Encoding]::UTF8.GetBytes("Method Not Allowed")) "text/plain; charset=utf-8"
      continue
    }

    $relative = [System.Uri]::UnescapeDataString($parts[1].Split("?")[0]).TrimStart("/")
    if ([string]::IsNullOrWhiteSpace($relative)) {
      $relative = "project-agent-graph.example.html"
    }
    $target = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($resolvedRoot, $relative.Replace("/", [System.IO.Path]::DirectorySeparatorChar)))
    if (-not $target.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      Send-Response $stream 403 "Forbidden" ([System.Text.Encoding]::UTF8.GetBytes("Forbidden")) "text/plain; charset=utf-8"
      continue
    }
    if ([System.IO.Directory]::Exists($target)) {
      $target = [System.IO.Path]::Combine($target, "index.html")
    }
    if (-not [System.IO.File]::Exists($target)) {
      Send-Response $stream 404 "Not Found" ([System.Text.Encoding]::UTF8.GetBytes("Not Found")) "text/plain; charset=utf-8"
      continue
    }

    $body = [System.IO.File]::ReadAllBytes($target)
    Send-Response $stream 200 "OK" $body (Get-Content-Type $target)
  } catch {
    try {
      Send-Response $stream 500 "Internal Server Error" ([System.Text.Encoding]::UTF8.GetBytes($_.Exception.Message)) "text/plain; charset=utf-8"
    } catch {
    }
  } finally {
    $client.Close()
  }
}
