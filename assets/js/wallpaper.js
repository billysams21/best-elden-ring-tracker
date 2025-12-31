/**
 * Dynamic Wallpaper System
 * Randomly selects and applies wallpaper
 */

(function () {
  const wallpapers = [
    'elden ring.jpg',
    'festival_radahn.jpg',
    'goddess_of_rot.jpg',
    'marika.jpg',
    'radahn_malenia.jpg',
    'ranni_moon.jpeg',
    'rauh_forest.jpeg',
    'roundtable.jpeg',
    'SOTE.jpg'
  ];

  // Select random wallpaper
  const randomWallpaper = wallpapers[Math.floor(Math.random() * wallpapers.length)];

  // Apply wallpaper with fixed center (landscape mode for all)
  const style = document.createElement('style');
  style.textContent = `
        body::before {
            background-image: url('./assets/wallpaper/${randomWallpaper}') !important;
            position: fixed !important;
            background-attachment: fixed !important;
            background-size: cover !important;
            background-position: center center !important;
        }
    `;
  document.head.appendChild(style);

  console.log('🎨 Wallpaper loaded:', randomWallpaper, '(Fixed center mode)');
})();
