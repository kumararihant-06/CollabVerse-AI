import axios from 'axios';

const WANDBOX_API = 'https://wandbox.org/api';

// Keywords to match compilers - we skip "head" versions (unstable)
// and prefer stable numbered releases
const LANGUAGE_KEYWORDS = {
  javascript: 'nodejs',
  python:     'cpython',
  cpp:        'gcc',
  c:          'gcc',
  java:       'openjdk',
  typescript: 'typescript',
  ruby:       'ruby',
  go:         'go',
  rust:       'rust',
  php:        'php',
};

// For C vs C++ we need to distinguish by the compiler's language field
const LANGUAGE_COMPILER_LANG = {
  cpp: 'C++',
  c:   'C',
};

// Cache the compiler list
let compilerCache = null;

const getCompilers = async () => {
  if (compilerCache) return compilerCache;
  const response = await axios.get(`${WANDBOX_API}/list.json`, { timeout: 10000 });
  compilerCache = response.data;
  return compilerCache;
};

const findBestCompiler = (compilers, language) => {
  const keyword = LANGUAGE_KEYWORDS[language];
  const requiredLang = LANGUAGE_COMPILER_LANG[language]; // only set for c/cpp

  // Filter by keyword match
  let candidates = compilers.filter(c =>
    c.name.toLowerCase().includes(keyword.toLowerCase())
  );

  // For C vs C++, filter by the language field
  if (requiredLang) {
    candidates = candidates.filter(c => c.language === requiredLang);
  }

  // Skip "head" versions (unstable) - prefer stable numbered releases
  const stable = candidates.filter(c => !c.name.includes('head'));

  // Pick from stable versions, or fall back to head if nothing else
  const pool = stable.length > 0 ? stable : candidates;

  if (pool.length === 0) return null;

  // Sort by name descending to get latest stable version first
  pool.sort((a, b) => b.name.localeCompare(a.name));

  return pool[0].name;
};

export const executeCodeService = async (code, language) => {
  try {
    const lang = language?.toLowerCase();

    if (!LANGUAGE_KEYWORDS[lang]) {
      return {
        success: false,
        error: `Unsupported language: "${language}". Supported: ${Object.keys(LANGUAGE_KEYWORDS).join(', ')}`,
      };
    }

    // Fetch real compiler list from Wandbox (cached after first call)
    const compilers = await getCompilers();
    const compiler = findBestCompiler(compilers, lang);

    if (!compiler) {
      return {
        success: false,
        error: `Could not find a stable compiler for ${language} on Wandbox.`,
      };
    }

    console.log(`⚡ Executing ${language} using compiler: ${compiler}`);

    const response = await axios.post(
      `${WANDBOX_API}/compile.json`,
      { compiler, code },
      { timeout: 30000 }
    );

    const result = response.data;

    // Log full result to help debug
    console.log('Wandbox result:', JSON.stringify(result, null, 2));

    if (result.status === '0') {
      return {
        success: true,
        output: result.program_output || result.compiler_output || '(No output)',
      };
    } else {
      // Build a helpful error message from whatever Wandbox gives us
      const errorParts = [
        result.compiler_error,
        result.program_error,
        result.compiler_message,
        result.signal,
        result.status ? `Exit code: ${result.status}` : null,
      ].filter(Boolean);

      const errorMsg = errorParts.join('\n') || 'Execution failed (no error details returned)';

      return {
        success: false,
        error: errorMsg,
        output: result.program_output || null,
      };
    }

  } catch (error) {
    // Log the FULL error so we can see what's really happening
    console.error('❌ Full error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return { success: false, error: 'Cannot reach Wandbox API. Check your internet connection.' };
    }
    if (error.response?.status === 429) {
      return { success: false, error: 'Too many requests. Please wait a moment and try again.' };
    }
    if (error.code === 'ECONNABORTED') {
      return { success: false, error: 'Code execution timed out (30s limit).' };
    }

    // Return the REAL error message, not just "unknown"
    const realError =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      'Unknown error occurred';

    return {
      success: false,
      error: typeof realError === 'object' ? JSON.stringify(realError) : realError,
    };
  }
};