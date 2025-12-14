import { GoogleGenAI } from '@google/genai'
import { getSetting } from '../db/settings.js'

/**
 * 发送消息给AI并获取响应
 * @param {string} prompt - 用户输入的提示词
 * @param {string} context - 当前编辑的内容作为上下文
 * @returns {Promise<string>} AI的响应文本
 */
export async function generateText(prompt, context = '') {
  try {
    const apiKey = await getSetting('googleApiKey')
    if (!apiKey) {
      throw new Error('Google API Key 未设置')
    }

    const modelName = await getSetting('modelName') || 'gemini-2.5-flash'
    
    const ai = new GoogleGenAI({ apiKey })

    // 构建完整的提示词，包含上下文
    let fullPrompt = prompt
    if (context && context.trim()) {
      fullPrompt = `当前内容：\n${context}\n\n用户请求：\n${prompt}`
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt
    })

    return response.text
  } catch (error) {
    console.error('AI generation error:', error)
    throw error
  }
}

/**
 * 流式生成文本（用于未来的实时输出）
 * @param {string} prompt - 用户输入的提示词
 * @param {string} context - 当前编辑的内容作为上下文
 * @returns {Promise<string>} AI的响应文本
 */
export async function generateTextStream(prompt, context = '') {
  try {
    const apiKey = await getSetting('googleApiKey')
    if (!apiKey) {
      throw new Error('Google API Key 未设置')
    }

    const modelName = await getSetting('modelName') || 'gemini-2.5-flash'
    
    const ai = new GoogleGenAI({ apiKey })

    let fullPrompt = prompt
    if (context && context.trim()) {
      fullPrompt = `当前内容：\n${context}\n\n用户请求：\n${prompt}`
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config: {
        stream: true
      }
    })

    return response.text
  } catch (error) {
    console.error('AI stream generation error:', error)
    throw error
  }
}
