function LoopApp() {
  const [t, setTweak] = window.useTweaks(window.TWEAK_DEFAULTS);
  const { TweaksPanel, TweakSection, TweakToggle, TweakSlider, TweakColor, CompositionStage, MoonLoop } = window;
  return React.createElement('div', { style: { position: 'relative', width: '100%', height: '100%' } },
    React.createElement(CompositionStage, {
      width: 1920, height: 1080, bg: t.bg,
      scenes: window.OM_SCENES, playback: window.OM_PLAYBACK,
    }, React.createElement(MoonLoop, { tweaks: t })),
    React.createElement(TweaksPanel, null,
      React.createElement(TweakSection, { label: 'Camera' }),
      React.createElement(TweakSlider, {
        label: 'Zoom per stage', value: t.zoomDepth, min: 3, max: 8, step: 0.5,
        onChange: (v) => setTweak('zoomDepth', v) }),
      React.createElement(TweakToggle, {
        label: 'Instrument frame', value: t.showHud, onChange: (v) => setTweak('showHud', v) }),
      React.createElement(TweakSection, { label: 'Ink' }),
      React.createElement(TweakColor, {
        label: 'Line', value: t.lineColor,
        options: ['#8FD6EA', '#E7EEF3', '#9DE8C0', '#C9B4F5'],
        onChange: (v) => setTweak('lineColor', v) }),
      React.createElement(TweakColor, {
        label: 'Accent', value: t.accentColor,
        options: ['#F2A45C', '#FF6B5E', '#F5E06B', '#6BC8FF'],
        onChange: (v) => setTweak('accentColor', v) }),
      React.createElement(TweakColor, {
        label: 'Ground', value: t.bg,
        options: ['#08131C', '#0B1020', '#101014', '#0A1A16'],
        onChange: (v) => setTweak('bg', v) }),
      React.createElement(TweakSection, { label: 'Workspace' }),
      React.createElement(TweakToggle, {
        label: 'Motion editor', value: t.motionEditor, onChange: (v) => setTweak('motionEditor', v) })));
}
window.LoopApp = LoopApp;
