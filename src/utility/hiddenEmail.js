function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
  
  function seededRandom(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
  
  function maskStringDeterministic(str, seed) {
    const len = str.length;
    if (len <= 1) return '*'; // Fully mask 1-char strings
  
    const maskCount = Math.max(1, Math.floor(len / 2));
    const indices = Array.from({ length: len }, (_, i) => i);
    const random = seededRandom(seed);
  
    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
  
    const maskSet = new Set(indices.slice(0, maskCount));
    return [...str]
      .map((char, i) => (maskSet.has(i) ? '*' : char))
      .join('');
  }
  
  function HiddenUsername( username ) {
    if (!username) return "";
    const seed = hashCode(username);
    return maskStringDeterministic(username, seed);
  }
  
 export default HiddenUsername;
  