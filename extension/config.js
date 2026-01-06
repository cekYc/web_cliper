// Extension Config - Production'da bu URL'yi değiştirin
const CONFIG = {
  // Development
  // API_URL: 'http://localhost:3000'
  
  // Production - Render/Railway deploy ettikten sonra bu URL'yi güncelleyin
  API_URL: 'http://localhost:3000'
};

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = CONFIG;
}
