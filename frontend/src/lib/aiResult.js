const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim().length > 0;
const quizOptions = ['optionA', 'optionB', 'optionC', 'optionD'];

function isQuizQuestion(question) {
  return isRecord(question)
    && isText(question.questionText ?? question.text)
    && quizOptions.some(option => isText(question[option]))
    && [...quizOptions, 'explanation'].every(field => question[field] == null || typeof question[field] === 'string');
}

function isMindmapNode(node) {
  return isRecord(node)
    && isText(node.label ?? node.title)
    && (node.children == null || (Array.isArray(node.children) && node.children.every(isMindmapNode)));
}

export function readAiResult(type, data) {
  if (type === 'summary' && isText(data)) return { title: 'Tóm tắt', summary: data };
  if (!isRecord(data)) return null;

  const title = typeof data.title === 'string' ? data.title : '';
  if (type === 'quiz' && Array.isArray(data.questions) && data.questions.length && data.questions.every(isQuizQuestion)) {
    return { ...data, title, questions: data.questions.map(question => ({
      ...question,
      questionText: question.questionText ?? question.text,
    })) };
  }
  if (type === 'mindmap' && isMindmapNode(data.structure)) return { ...data, title };
  const summary = data.summary ?? data.summaryText ?? data.content;
  if (type === 'summary' && isText(summary)) return { ...data, title, summary };
  return null;
}
