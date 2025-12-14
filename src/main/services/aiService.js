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
      contents: fullPrompt,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE'
        }
      ]
    })

    // 检查是否有内容被阻止
    if (response.promptFeedback?.blockReason) {
      const blockReason = response.promptFeedback.blockReason
      console.error('Content blocked by AI:', blockReason)
      
      const blockReasonMessages = {
        'PROHIBITED_CONTENT': '内容被 AI 安全策略阻止（禁止内容）',
        'SAFETY': '内容被 AI 安全策略阻止（安全原因）',
        'OTHER': '内容被 AI 安全策略阻止'
      }
      
      throw new Error(blockReasonMessages[blockReason] || `内容被阻止: ${blockReason}`)
    }

    if (!response || !response.text) {
      console.error('Invalid AI response:', response)
      throw new Error('AI 返回了空响应，请尝试修改提示词')
    }

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
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE'
        }
      ],
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
