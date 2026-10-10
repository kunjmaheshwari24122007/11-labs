param(
    [string]$Text = "Welcome to ElevenNarrate studio narration.",
    [string]$OutPath = "test_speech.wav",
    [string]$Voice = "",
    [int]$Rate = 0,
    [int]$Volume = 100,
    [switch]$ListVoices
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

if ($ListVoices) {
    $voices = @()
    foreach ($v in $synth.GetInstalledVoices()) {
        $info = $v.VoiceInfo
        $voices += [PSCustomObject]@{
            Name = $info.Name
            Gender = [string]$info.Gender
            Culture = $info.Culture.Name
            Description = $info.Description
        }
    }
    $synth.Dispose()
    Write-Output (ConvertTo-Json $voices)
    exit 0
}

if ($Voice -ne "") {
    try {
        $synth.SelectVoice($Voice)
    } catch {
        # Use default system voice
    }
}

if ($Rate -ge -10 -and $Rate -le 10) {
    $synth.Rate = $Rate
}
if ($Volume -ge 0 -and $Volume -le 100) {
    $synth.Volume = $Volume
}

$synth.SetOutputToWaveFile($OutPath)
$synth.Speak($Text)
$synth.Dispose()
Write-Output "Generated audio successfully."
