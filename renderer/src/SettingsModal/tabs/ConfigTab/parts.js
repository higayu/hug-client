export const DEFAULT_CONFIG_FORM = {
  HUG_USERNAME: '',
  HUG_PASSWORD: '',

  OPENAI_MAIL: '',
  OPENAI_PASSWORD: '',

  GEMINI_API_KEY: '',
  GEMINI_MODEL: 'gemini-3.5-flash',

  DEEPSEEK_MAIL: '',
  DEEPSEEK_PASSWORD: '',

  OPEN_ROUTER_API_KEY: '',
  OPEN_ROUTER_MODEL: '',

  OLLAMA_URL: '',
  OLLAMA_MODEL: 'gemma4:latest',
}

export const CONFIG_KEYS = Object.keys(DEFAULT_CONFIG_FORM)

export const createConfigFormState = (source = {}) => {
  return CONFIG_KEYS.reduce((result, key) => {
    const defaultValue = DEFAULT_CONFIG_FORM[key]

    result[key] = String(
      source?.[key] ??
      defaultValue
    )

    return result
  }, {})
}

export const normalizeConfigData = (form = {}) => {
  return {
    HUG_USERNAME: String(
      form.HUG_USERNAME ?? ''
    ).trim(),

    HUG_PASSWORD: String(
      form.HUG_PASSWORD ?? ''
    ),

    OPENAI_MAIL: String(
      form.OPENAI_MAIL ?? ''
    ).trim(),

    OPENAI_PASSWORD: String(
      form.OPENAI_PASSWORD ?? ''
    ),

    GEMINI_API_KEY: String(
      form.GEMINI_API_KEY ?? ''
    ).trim(),

    GEMINI_MODEL:
      String(
        form.GEMINI_MODEL ?? ''
      ).trim() ||
      DEFAULT_CONFIG_FORM.GEMINI_MODEL,

    DEEPSEEK_MAIL: String(
      form.DEEPSEEK_MAIL ?? ''
    ).trim(),

    DEEPSEEK_PASSWORD: String(
      form.DEEPSEEK_PASSWORD ?? ''
    ),

    OPEN_ROUTER_API_KEY: String(
      form.OPEN_ROUTER_API_KEY ?? ''
    ).trim(),

    OPEN_ROUTER_MODEL: String(
      form.OPEN_ROUTER_MODEL ?? ''
    ).trim(),

    OLLAMA_URL: String(
      form.OLLAMA_URL ?? ''
    ).trim(),

    OLLAMA_MODEL:
      String(
        form.OLLAMA_MODEL ?? ''
      ).trim() ||
      DEFAULT_CONFIG_FORM.OLLAMA_MODEL,
  }
}