import { expandedTemplateReply } from './template-responder.js';

const BURN_PICTURE_NOTICE = "I can't receive burn pictures on the computer version of Lovense because they don't show up for me. Please send it as a regular picture instead.";

export function isBurnPictureMarker(message) {
  return /\[burnpicture\s*\[/i.test(String(message || ''));
}

export function configuredPersonaPrompt(config) {
  const facts = [
    ['Username', config.chatUsername],
    ['Display name', config.chatDisplayName],
    ['First name', config.chatFirstName],
    ['Last name', config.chatLastName],
    ['Date of birth', config.chatDateOfBirth],
    ['Place of birth', config.chatPlaceOfBirth],
    ['Children', config.chatChildren],
    ['Age', config.chatAge],
    ['Pronouns', config.chatPronouns],
    ['Location', config.chatLocation],
    ['Occupation', config.chatOccupation],
    ['Relationship status', config.chatRelationshipStatus],
    ['Interests', config.chatInterests]
  ].filter(([, value]) => value);
  if (!facts.length) return '';
  return `\n\nConfigured persona facts from config.ini:\n${facts.map(([label, value]) => `- ${label}: ${value}`).join('\n')}\nUse these as the canonical persona facts when relevant. Do not invent or contradict personal details.`;
}

function compact(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) throw new Error('The reply service returned an empty response.');
  return text.length <= maxLength ? text : `${text.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

function unknownFact(tease) {
  return `${tease} You’ll have to earn that answer 😉`;
}

function formatAmericanDate(value) {
  const [month, day, year] = value.split('/').map(Number);
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
  return `${monthName} ${day}, ${year}`;
}

function templateReply(config, message, history = []) {
  const text = String(message || '').trim();
  const conversationalTurns = history.filter(item => item?.role === 'user').length;
  const choose = candidates => candidates[conversationalTurns % candidates.length];
  const fullName = [config.chatFirstName, config.chatLastName].filter(Boolean).join(' ');
  const name = config.chatDisplayName || fullName || config.chatUsername;
  const previousAssistant = [...history].reverse().find(item => item?.role === 'assistant')?.content || '';

  if (/\b(what(?:’|'| i)s your name|who are you|what should i call you)\b/i.test(text)) return name ? `You can call me ${name}. What should I call you?` : unknownFact('Curious about me already?');
  if (/\b(what(?:’|'| i)s your first name)\b/i.test(text)) return config.chatFirstName ? `My first name is ${config.chatFirstName}. What’s yours?` : unknownFact('You want my first name?');
  if (/\b(what(?:’|'| i)s your last name|what(?:’|'| i)s your surname)\b/i.test(text)) return config.chatLastName ? `My last name is ${config.chatLastName}. What made you ask?` : unknownFact('Going for my full identity already?');
  if (/\b(when is your birthday|what(?:’|'| i)s your birthday|what(?:’|'| i)s your date of birth|when were you born)\b/i.test(text)) return config.chatDateOfBirth ? `My birthday is ${formatAmericanDate(config.chatDateOfBirth)}. When is yours?` : unknownFact('Planning ahead for my birthday?');
  if (/\b(where were you born|what(?:’|'| i)s your place of birth)\b/i.test(text)) return config.chatPlaceOfBirth ? `I was born in ${config.chatPlaceOfBirth}. Where were you born?` : unknownFact('Digging into my origin story?');
  if (/\b(do you have (?:any )?(?:children|kids)|how many (?:children|kids) do you have|are you a (?:mom|mother|dad|father|parent))\b/i.test(text)) return config.chatChildren ? `${config.chatChildren}. How about you?` : unknownFact('That’s a personal one.');
  if (/\b(how old are you|what(?:’|'| i)s your age)\b/i.test(text)) return config.chatAge ? `I’m ${config.chatAge}. How old are you?` : unknownFact('That’s a bold question.');
  if (/\b(where are you from|where do you live|where are you located)\b/i.test(text)) return config.chatLocation ? `I’m in ${config.chatLocation}. Where are you from?` : unknownFact('Trying to find me?');
  if (/\b(what do you do|what(?:’|'| i)s your job|where do you work)\b/i.test(text)) return config.chatOccupation ? `${config.chatOccupation}. What do you do?` : unknownFact('You want to know how I spend my days?');
  if (/\b(what are you into|what do you like|what are your interests|what are your hobbies)\b/i.test(text)) return config.chatInterests ? `I’m into ${config.chatInterests}. What do you enjoy?` : unknownFact('Mmm, eager to learn what I like?');
  if (/\b(are you single|relationship status|do you have a partner)\b/i.test(text)) return config.chatRelationshipStatus ? `I’m ${config.chatRelationshipStatus}. What about you?` : unknownFact('Getting personal already?');
  if (/\b(what are your pronouns|which pronouns do you use)\b/i.test(text)) return config.chatPronouns ? `I use ${config.chatPronouns}. Which pronouns do you use?` : 'Which pronouns do you use? You can ask me mine too.';

  if (/\b(hbu|how about you|how bout you)\b/i.test(text)) return choose(["I’m doing pretty good—just taking it easy too. What does your ideal chill night look like?", "I’m good, just relaxing and enjoying our conversation. What are you doing while you chill?"]);
  if (/\b(wyd|what are you doing|whatcha doing|what are you up to)\b/i.test(text)) return choose(["I’m relaxing and talking with you. What are you getting into?", "Just taking it easy and enjoying the conversation. What about you?"]);
  if (/\b(what do you mean|what did you mean|huh|i don'?t understand)\b/i.test(text)) {
    if (/tell me (?:a little )?more|keep talking|what happened next/i.test(previousAssistant)) return "I meant I wanted to hear more about what you’re doing or what’s on your mind—nothing complicated.";
    return previousAssistant ? `I meant what I said about ${previousAssistant.replace(/[?!.]+$/g, '').slice(0, 90).toLowerCase()}. Which part was unclear?` : 'I may have worded that badly. Which part should I explain?';
  }
  if (/\b(thanks|thank you|ty)\b/i.test(text)) return choose(["You’re welcome. So, what’s on your mind?", 'Anytime. What do you feel like talking about?']);
  if (/^(yes|yeah|yep|sure|okay|ok|no|nope)\b/i.test(text)) return choose(['Got it. What would you like to do or talk about next?', 'Fair enough. Tell me what you’re thinking.']);
  if (/^(hi|hey|hello|hiya)\b/i.test(text)) return choose(['Hey! How has your day been?', 'Hi there. What are you up to today?', 'Hey, you. It’s good to hear from you 😉']);
  if (/how are you|how(?:’|'| a)?re you/i.test(text)) return choose(['I’m doing well. How are you feeling today?', 'Pretty good, thanks for asking. What has your day been like?', 'Better now that you’re here. What have you been up to? 😉']);
  if (/\?$/.test(text)) return choose(["I’m not completely sure, but I want to understand what you mean. Can you give me a little more context?", "That depends on what you have in mind. What’s your take on it?", 'I want to answer that properly—what part matters most to you?']);
  return choose(['Tell me more—what happened next?', 'That’s interesting. How do you feel about it?', 'I’m listening. What made you think of that?', 'Mmm, I like the way you’re thinking. Keep talking 😉']);
}

async function requestJson(url, options, fetchImpl, timeoutMs) {
  const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error?.message || body.error || `Reply service returned HTTP ${response.status}.`);
    error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw error;
  }
  return body;
}

async function retryReply(operation, {
  shouldContinue = () => true,
  waitImpl = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
  retryDelayMs = 2_000
} = {}) {
  while (shouldContinue()) {
    try {
      return await operation();
    } catch (error) {
      if (error?.retryable === false) throw error;
      if (!shouldContinue()) throw new Error('Reply generation was cancelled.');
      await waitImpl(retryDelayMs);
    }
  }
  throw new Error('Reply generation was cancelled.');
}

export async function generateReply(config, message, fetchImpl = globalThis.fetch, options = {}) {
  const history = Array.isArray(options.history) ? options.history.slice(-config.conversationMemoryMessages) : [];
  const maxReplyChars = Number.isInteger(options.maxReplyChars) ? options.maxReplyChars : config.maxReplyChars;
  if (isBurnPictureMarker(message)) return compact(BURN_PICTURE_NOTICE, maxReplyChars);
  if (config.replyProvider === 'template') return compact(expandedTemplateReply(config, message, history), maxReplyChars);
  const includeHistory = config.replyProvider === 'ollama' || config.sendMemoryToOpenAI;
  // Reply Studio supplies its own expanded prompt. Normal automated replies
  // must receive the persona fields loaded from the private config.ini.
  const systemPrompt = options.systemPrompt || `${config.replySystemPrompt}${configuredPersonaPrompt(config)}`;
  const requestTimeoutMs = Number.isFinite(options.requestTimeoutMs) ? Math.max(1, options.requestTimeoutMs) : config.replyRequestTimeoutMs;
  const messages = [{ role: 'system', content: systemPrompt }, ...(includeHistory ? history : []), { role: 'user', content: String(message || '') }];
  if (config.replyProvider === 'ollama') {
    const headers = { 'content-type': 'application/json' };
    if (config.ollamaApiKey) headers.authorization = `Bearer ${config.ollamaApiKey}`;
    return retryReply(async () => {
      const body = await requestJson(`${config.ollamaUrl}/api/chat`, { method: 'POST', headers, body: JSON.stringify({ model: config.replyModel, messages, stream: false }) }, fetchImpl, requestTimeoutMs);
      return compact(body.message?.content, maxReplyChars);
    }, options);
  }
  return retryReply(async () => {
    const body = await requestJson(`${config.openaiBaseUrl}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${config.openaiApiKey}` }, body: JSON.stringify({ model: config.replyModel, messages, temperature: 0.7 }) }, fetchImpl, requestTimeoutMs);
    return compact(body.choices?.[0]?.message?.content, maxReplyChars);
  }, options);
}

export function createReplyDeduper(historyLimit = 100) {
  const histories = new Map();
  const repetitions = new Map();
  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-US');
  const lowerFirst = value => value ? value[0].toLocaleLowerCase('en-US') + value.slice(1) : value;
  const prefixes = ['I already told you—', 'Pay attention—', 'Still the same answer—', 'You’re making me repeat myself—'];
  return (conversation, reply) => {
    const conversationKey = normalize(conversation);
    const original = String(reply || '').replace(/\s+/g, ' ').trim();
    const replyKey = normalize(original);
    if (!conversationKey || !replyKey) return original;
    const history = histories.get(conversationKey) || [];
    let result = original;
    if (history.includes(replyKey)) {
      const repetitionKey = `${conversationKey}\0${replyKey}`;
      const count = (repetitions.get(repetitionKey) || 1) + 1;
      repetitions.set(repetitionKey, count);
      const prefix = prefixes[count - 2] || `That’s ${count} times now—`;
      result = `${prefix}${lowerFirst(original)}`;
    }
    history.push(normalize(result));
    if (history.length > historyLimit) history.splice(0, history.length - historyLimit);
    histories.set(conversationKey, history);
    return result;
  };
}

