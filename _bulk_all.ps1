$dir = 'c:\Users\Conation\Desktop\JUJCO WEB'
$files = Get-ChildItem -Path $dir -Filter '*.html' -File
$indexPages = @('index.html', 'index-2.html', 'home-v2.html')

# Byte sequences to replace: UTF-8 E2 80 93 -> en-dash replacement (write as plain "-" or use UTF-8 bytes for "–")
# Better: decode the whole file as UTF-8, do string ops, then save as UTF-8 (to normalize the corrupted bytes,
# which currently are WINDOWS-1252 interpretation: chars 0xE2 0x20AC 0x201C etc). We detect those surrogate-ish chars.

$enDash = [char]0x2013
$emDash = [char]0x2014
$ldq = [char]0x201C
$rdq = [char]0x201D
$lsq = [char]0x2018
$rsq = [char]0x2019
$aCirc = [char]0x00E2   # 'â'
$euro  = [char]0x20AC   # '€'

$stats = @{
    TitlesFixed = 0
    PreloadersVideo = 0
    MarqueeItemsFixed = 0
    PricingHiddenIndex = 0
    PricingHiddenService = 0
    TeamCards = 0
}

foreach ($f in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $c = [System.Text.Encoding]::UTF8.GetString($bytes)
    $changed = $false

    # 1) Fix corrupted sequences: if we see "â€" followed by a typographic char, it was double-encoded.
    # Replace known mojibake trios:
    $mojibakePatterns = @(
        @{ Bad = [string]::new([char[]]@($aCirc, $euro, [char]0x201C)); Good = [string]$enDash },
        @{ Bad = [string]::new([char[]]@($aCirc, $euro, [char]0x201D)); Good = [string]$emDash },
        @{ Bad = [string]::new([char[]]@($aCirc, $euro, [char]0x2122)); Good = [string]$rsq },
        @{ Bad = [string]::new([char[]]@($aCirc, $euro, [char]0x02DC)); Good = [string]$lsq },
        @{ Bad = [string]::new([char[]]@($aCirc, $euro, [char]0x009C)); Good = [string]$rdq },
        @{ Bad = [string]::new([char[]]@($aCirc, $euro, [char]0x0098)); Good = [string]$ldq },
        @{ Bad = [string]::new([char[]]@($aCirc, $euro, [char]0x2013)); Good = [string]$enDash },
        @{ Bad = [string]::new([char[]]@($aCirc, $euro, [char]0x2014)); Good = [string]$emDash },
        @{ Bad = 'â€“'; Good = [string]$enDash },
        @{ Bad = 'â€”'; Good = [string]$emDash },
        @{ Bad = 'â€™'; Good = [string]$rsq },
        @{ Bad = 'â€œ'; Good = [string]$ldq },
        @{ Bad = 'â€'; Good = [string]$rdq }
    )
    foreach ($p in $mojibakePatterns) {
        if ($c.Contains($p.Bad)) {
            $c = $c.Replace($p.Bad, $p.Good)
            $changed = $true
        }
    }

    # 1b) Fix double <title>: <title>JUJCO – <title>...  ->  <title>...
    $titleRegex = [regex]'(?s)<title>\s*JUJCO\s*[–—\-]\s*<title>'
    if ($titleRegex.IsMatch($c)) {
        $c = $titleRegex.Replace($c, '<title>', 1)
        $changed = $true
    }
    if ($changed -or $c.Contains('JUJCO') -and $c -match '<title>.*â€|<title>.*â€”|<title>.*€|<title>.*[“”]JUJCO|â€[”“]') { }
    if ($changed) { $stats.TitlesFixed++ }

    # 2) PRELOADER VIDEO
    if ($c.Contains('assets/img/preloader_icon.svg')) {
        $video = if ($indexPages -contains $f.Name) { 'assets/preloader/Preload1.mp4' } else { 'assets/preloader/Preload2.mp4' }
        $newVideo = '<video class="cs_preloader_video" src="' + $video + '" muted autoplay loop playsinline disableRemotePlayback preload="auto" poster="assets/img/logo.png"></video>'
        $c = $c.Replace('<img src="assets/img/preloader_icon.svg" alt="JUJCO">', $newVideo)
        $stats.PreloadersVideo++
        $changed = $true
    }

    # 3) MARQUEE: first marquee spans without the class
    $oldM = '<div class="jujco-marquee__track">
        <span>Edmonton AC Repair</span><span>Furnace Installation</span><span>24/7 Emergency</span><span>Duct Cleaning</span><span>Heat Pump Service</span><span>Indoor Air Quality</span>
      </div>'
    $newM = '<div class="jujco-marquee__track">
        <span class="jujco-marquee__item">Edmonton AC Repair</span>
        <span class="jujco-marquee__item">Furnace Installation</span>
        <span class="jujco-marquee__item">24/7 Emergency</span>
        <span class="jujco-marquee__item">Duct Cleaning</span>
        <span class="jujco-marquee__item">Heat Pump Service</span>
        <span class="jujco-marquee__item">Indoor Air Quality</span>
        <span class="jujco-marquee__item">Edmonton AC Repair</span>
        <span class="jujco-marquee__item">Furnace Installation</span>
        <span class="jujco-marquee__item">24/7 Emergency</span>
        <span class="jujco-marquee__item">Duct Cleaning</span>
        <span class="jujco-marquee__item">Heat Pump Service</span>
        <span class="jujco-marquee__item">Indoor Air Quality</span>
      </div>'
    if ($c.Contains($oldM)) {
        $c = $c.Replace($oldM, $newM)
        $stats.MarqueeItemsFixed++
        $changed = $true
    }

    # 4) PRICING HIDE on index.html
    if ($f.Name -eq 'index.html') {
        $marker = 'Our price plan'
        $idx = $c.IndexOf($marker)
        if ($idx -gt 0) {
            $secStart = $c.LastIndexOf('<section>', $idx)
            $secStart2 = $c.LastIndexOf('<section ', $idx)
            if ($secStart2 -gt $secStart) { $secStart = $secStart2 }
            if ($secStart -lt 0) { $secStart = 0 }
            $afterSub = $c.Substring($secStart)
            # Count open/close </section>; pricing ends after cs_tabs with 2 closures in index.html
            $closeTag = '</section>'
            $firstClose = $afterSub.IndexOf($closeTag)
            $secondClose = $afterSub.IndexOf($closeTag, $firstClose + 1)
            if ($firstClose -gt 0 -and $secondClose -gt $firstClose) {
                $sectionLen = $secondClose + $closeTag.Length
                $sectionStr = $afterSub.Substring(0, $sectionLen)
                $wrapped = "`r`n<!-- PRICING (Monthly / Yearly) TEMPORARILY HIDDEN`r`n" + $sectionStr + "`r`n-->`r`n"
                $c = $c.Remove($secStart, $sectionLen).Insert($secStart, $wrapped)
                $stats.PricingHiddenIndex++
                $changed = $true
            }
        }
    }

    # 5) PRICING HIDE on service / index-2 / home-v2: hide 3 columns of pricing
    if ($f.Name -eq 'service.html' -or $f.Name -eq 'index-2.html' -or $f.Name -eq 'home-v2.html') {
        $marker = 'Basic Plan'
        $idxStart = $c.IndexOf($marker)
        if ($idxStart -gt 0) {
            # Walk back to first "col-lg-4" that contains the first Basic Plan
            $divStart = $c.LastIndexOf('<div class="col-lg-4">', $idxStart)
            if ($divStart -lt 0) { $divStart = $c.LastIndexOf('col-lg-4', $idxStart) }
            if ($divStart -gt 0) {
                $divStartActual = $c.LastIndexOf('<div', $divStart)
                $subStr = $c.Substring($divStartActual)
                # Find 3rd plan Choose Plan button close -> 3 columns end
                $planCount = 0
                $needle = '<a href="contact.html" class="cs_btn cs_style_1 cs_type_1">'
                $pos = 0
                $totalLen = 0
                for ($i = 0; $i -lt 3; $i++) {
                    $pos = $subStr.IndexOf($needle, $pos)
                    if ($pos -lt 0) { break }
                    $pos += $needle.Length
                }
                if ($pos -gt 0) {
                    # find </div></div> for the col after the button
                    $endCol = $subStr.IndexOf('</div></div>', $pos)
                    if ($endCol -gt 0) {
                        $totalLen = $endCol + '</div></div>'.Length
                        $sectionStr = $subStr.Substring(0, $totalLen)
                        $wrapped = "`r`n<!-- PRICING PLANS (Monthly / Yearly) TEMPORARILY HIDDEN`r`n" + $sectionStr + "`r`n-->`r`n"
                        $c = $c.Remove($divStartActual, $totalLen).Insert($divStartActual, $wrapped)
                        $stats.PricingHiddenService++
                        $changed = $true
                    }
                }
            }
        }
    }

    # 6) TEAM CARDS: remove name/designation; replace phone with new numbers
    if ($c.Contains('cs_team_member_name')) {
        # 6a) Replace name block with contact only (non-team detail pages only? all pages where names appear)
        # Pattern 1 (sliders/team section): <h3 class="cs_team_member_name cs_fs_24 cs_semibold cs_mb_4">NAME</h3>\n  <p class="cs_team_member_designation...">ROLE</p>
        $nameRe = [regex]'(?s)<h3 class="cs_team_member_name[^>]*>(?:<a href="[^"]*">)?[^<>]+(?:</a>)?</h3>\s*<p class="cs_team_member_designation[^>]*>[^<>]+</p>'
        if ($nameRe.IsMatch($c)) {
            $replacementBlock = '<h3 class="cs_team_member_name cs_fs_24 cs_semibold cs_mb_4 cs_heading_color">Contact Us</h3>
                    <p class="cs_team_member_designation cs_fs_14 mb-0"><a href="tel:+17809822577">(780) 982-2577</a><br><a href="tel:+17809823377">(780) 982-3377</a></p>'
            $c = $nameRe.Replace($c, $replacementBlock)
            $stats.TeamCards++
            $changed = $true
        }
        # 6b) Replace phone number line itself (+img + old num) with clickable 2 lines
        $phoneRe = [regex]'(?s)<div class="cs_team_member_phone_number[^>]*>\s*<img src="assets/img/icons/phone_icon_2\.svg" alt="">\s*[^\n<]+</div>'
        if ($phoneRe.IsMatch($c)) {
            $newPhone = '<div class="cs_team_member_phone_number cs_fs_18 cs_heading_color">
                    <a href="mailto:info@jujcohvac.com">info@jujcohvac.com</a>
                  </div>'
            $c = $phoneRe.Replace($c, $newPhone)
            $changed = $true
        }
    }

    if ($changed) {
        [System.IO.File]::WriteAllText($f.FullName, $c, (New-Object System.Text.UTF8Encoding $false))
    }
}

Write-Host '=== FINAL BULK STATS ==='
foreach ($k in $stats.Keys) { Write-Host ('{0}: {1}' -f $k, $stats[$k]) }
