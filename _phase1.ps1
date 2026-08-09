$dir = 'c:\Users\Conation\Desktop\JUJCO WEB'
$files = Get-ChildItem -Path $dir -Filter '*.html' -File
$indexPages = @('index.html', 'index-2.html', 'home-v2.html')

$stats = @{
    TitlesFixed = 0
    PreloadersVideo = 0
    MarqueeItemsFixed = 0
    PricingHiddenIndex = 0
    PricingHiddenService = 0
}

foreach ($f in $files) {
    $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $changed = $false

    # TITLE FIX: raw bytes already handled by read as UTF8; do string replacement
    $titleFixed = $false
    if ($c -match 'JUJCO \u00e2\u20ac\u201c Heating') { }
    # Direct char replace
    if ($c.Contains([char]0x00E2) -and $c.Contains([char]0x20AC) -and $c.Contains([char]0x201C)) { }
    # Simple approach: replace known mojibake bytes via string
    $c2 = $c
    $c2 = $c2.Replace('â€“', '–').Replace('â€”', '—').Replace('â€™', "'").Replace('â€œ', '"').Replace('â€', '"')
    if ($c2 -ne $c) { $stats.TitlesFixed++; $changed = $true; $c = $c2 }

    # FIX DOUBLE <title> (occurs on many pages: <title>JUJCO – <title>JUJCO - ...)
    $titleRegex = [regex]'(?s)<title>\s*JUJCO\s*[–—\-]\s*<title>'
    if ($titleRegex.IsMatch($c)) {
        $c = $titleRegex.Replace($c, '<title>', 1)
        $changed = $true
    }

    # PRELOADER: replace <img src="assets/img/preloader_icon.svg" alt="JUJCO">
    if ($c.Contains('assets/img/preloader_icon.svg')) {
        $video = if ($indexPages -contains $f.Name) { 'assets/preloader/Preload1.mp4' } else { 'assets/preloader/Preload2.mp4' }
        $newVideo = '<video class="cs_preloader_video" src="' + $video + '" muted autoplay loop playsinline disableRemotePlayback preload="auto" poster="assets/img/logo.png"></video>'
        $c = $c.Replace('<img src="assets/img/preloader_icon.svg" alt="JUJCO">', $newVideo)
        $stats.PreloadersVideo++
        $changed = $true
    }

    # MARQUEE: first marquee items (without class) -> add jujco-marquee__item and duplicate for seamless
    if ($c.Contains('<section class="jujco-marquee" aria-hidden="true">') -and $c.Contains('<span>Edmonton AC Repair</span>')) {
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
    }

    # PRICING HIDE: index.html -> wrap section with "Our price plan"
    if ($f.Name -eq 'index.html') {
        $marker = 'Our price plan'
        $idx = $c.IndexOf($marker)
        if ($idx -gt 0) {
            # Find opening <section> backward from heading (~300 chars before)
            $startSearch = [Math]::Max(0, $idx - 500)
            $secStart = $c.LastIndexOf('<section>', $idx)
            if ($secStart -lt 0) { $secStart = $c.LastIndexOf('<section ', $idx) }
            # Find closing </section> forward (skip nested by counting; simple: find next 3 closures after monthly/yearly tabs end)
            # Use regex: from <section (Our price plan)... up to </section> that matches the next 3 plans end
            $re = [regex]'(?s)(<section>(?:(?!<\/section>).)*?Our price plan(?:(?!<\/section>).)*?<\/section>\s*<\/section>)'
            if ($re.IsMatch($c)) {
                $c = $re.Replace($c, {
                    param($mm)
                    "`r`n<!-- PRICING (Monthly / Yearly) TEMPORARILY HIDDEN`r`n" + $mm.Value + "`r`n-->`r`n"
                }, 1)
                $stats.PricingHiddenIndex++
                $changed = $true
            }
        }
    }

    # PRICING HIDE: service.html / index-2 / home-v2 -> wrap 3 plans <div class="cs_pricing_plan cs_style_1"> ... group
    if ($f.Name -eq 'service.html' -or $f.Name -eq 'index-2.html' -or $f.Name -eq 'home-v2.html') {
        $re = [regex]'(?s)(<div class="col-lg-[0-9]+">\s*<div class="cs_pricing_plan cs_style_1">.*?(?:<\/div>\s*<\/div>)\s*(?:<div class="col-lg-[0-9]+">\s*<div class="cs_pricing_plan cs_style_1">.*?(?:<\/div>\s*<\/div>)\s*){2})'
        if ($re.IsMatch($c)) {
            $c = $re.Replace($c, {
                param($mm)
                "`r`n<!-- PRICING PLANS (Monthly / Yearly) TEMPORARILY HIDDEN`r`n" + $mm.Value + "`r`n-->`r`n"
            }, 1)
            $stats.PricingHiddenService++
            $changed = $true
        }
    }

    if ($changed) {
        [System.IO.File]::WriteAllText($f.FullName, $c, (New-Object System.Text.UTF8Encoding $false))
    }
}

Write-Host '=== PHASE 1 STATS ==='
$stats.GetEnumerator() | ForEach-Object { Write-Host ('{0}: {1}' -f $_.Key, $_.Value) }
