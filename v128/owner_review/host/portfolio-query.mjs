// Match the original native portfolio query fields and finite value bounds.
// This validates transport only; native portfolioQuery still applies the filters.
export function validPortfolioQuery(search) {
  if (search === '') return true;
  if (typeof search !== 'string' || !search.startsWith('?') || search.length > 4096
    || /%(?![0-9a-fA-F]{2})/.test(search)) return false;
  const raw = search.slice(1), params = new URLSearchParams(raw), seen = new Set();
  if (!raw || params.toString() !== raw) return false;
  for (const [key, value] of params) {
    if (seen.has(key) || /[\u0000-\u001f\u007f]/.test(value)) return false;
    seen.add(key);
    switch (key) {
      case 'missionId': if (!/^[A-Za-z0-9_.:-]{1,160}$/.test(value)) return false; break;
      case 'page': if (!/^[1-9][0-9]{0,5}$/.test(value) || Number(value) > 100000) return false; break;
      case 'pageSize': if (!['10', '25', '50'].includes(value)) return false; break;
      case 'search': if (value.length > 200) return false; break;
      case 'category': if (value.length > 160) return false; break;
      case 'verdict': if (value.length > 80) return false; break;
      case 'classification': if (!['REAL_READ_ONLY', 'SYNTHETIC', 'ALL'].includes(value)) return false; break;
      case 'sort': if (!['title', 'updated', 'contribution'].includes(value)) return false; break;
      case 'direction': if (!['asc', 'desc'].includes(value)) return false; break;
      default: return false;
    }
  }
  return true;
}
