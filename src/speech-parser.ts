export class SpeechParser {
  private numberWords: Record<string, string> = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
    'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
    'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
    'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
    'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000'
  };

  private operatorWords: Record<string, string> = {
    'plus': '+', 'add': '+', 'and': '+', 'sum': '+',
    'minus': '-', 'subtract': '-', 'take away': '-', 'less': '-',
    'times': '*', 'multiply': '*', 'multiplied by': '*', 'x': '*',
    'divide': '/', 'divided by': '/', 'over': '/',
    'to the power of': '^', 'power of': '^', 'raised to': '^', 'exponent': '^', 'power': '^',
    // Handle both "squared"/"square" and "cubed"/"cube" for flexibility
    'squared': '^2', 'square': '^2', 'cubed': '^3', 'cube': '^3',
    'percent': '%', 'modulo': '%', 'mod': '%',
    'square root of': 'sqrt', 'square root': 'sqrt', 'root of': 'sqrt', 'root': 'sqrt', 'sqrt': 'sqrt',
    'cube root of': 'cbrt', 'cube root': 'cbrt',
    'absolute value': 'abs', 'absolute': 'abs',
    'sine': 'sin', 'cosine': 'cos', 'tangent': 'tan', 'factorial': 'fact',
    'log': 'log', 'logarithm': 'log', 'natural log': 'ln', 'ln': 'ln',
    'floor': 'floor', 'ceiling': 'ceil', 'round': 'round'
  };

  parse(text: string): string {
    let normalized = text.toLowerCase().trim();

    normalized = this.normalizeCommonPhrases(normalized);
    normalized = this.replaceOperators(normalized);
    normalized = this.replaceNumbers(normalized);
    normalized = this.handleSpecialCases(normalized);
    normalized = this.cleanExpression(normalized);

      console.log('[Parser Debug]', text, '→', normalized);

    return normalized;
  }

  private normalizeCommonPhrases(text: string): string {
    const replacements: Record<string, string> = {
      'what is': '',
      "what's": '',
      'calculate': '',
      'compute': '',
      'equals': '=',
      'equal': '=',
      'is': '=',
      'point': '.',
      'decimal': '.',
      'negative': '-',
      'positive': '+',
    };

    let result = text;
    for (const [phrase, replacement] of Object.entries(replacements)) {
      result = result.replace(new RegExp(phrase, 'g'), replacement);
    }

    return result;
  }

  private replaceOperators(text: string): string {
    let result = text;

    const sortedOperators = Object.entries(this.operatorWords)
      .sort(([a], [b]) => b.length - a.length);

    for (const [word, symbol] of sortedOperators) {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      result = result.replace(regex, ` ${symbol} `);
    }

    return result;
  }

  private replaceNumbers(text: string): string {
    let result = text;

    const sortedNumbers = Object.entries(this.numberWords)
      .sort(([a], [b]) => b.length - a.length);

    for (const [word, digit] of sortedNumbers) {
      result = result.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
    }

    result = this.handleCompoundNumbers(result);

    return result;
  }

  private handleCompoundNumbers(text: string): string {
    let result = text;

    result = result.replace(/(\d+)\s+100/g, (_, num) => String(parseInt(num) * 100));
    result = result.replace(/(\d+)\s+1000/g, (_, num) => String(parseInt(num) * 1000));

    result = result.replace(/(\d{2,})\s+(\d{1,2})(?!\d)/g, '$1$2');

    return result;
  }

  private handleSpecialCases(text: string): string {
    let result = text;

    // Handle "X squared" and "X cubed" patterns (postfix notation)
    // Match: number followed by space and ^2 or ^3
    result = result.replace(/(\d+\.?\d*)\s+\^2(?!\d)/g, '($1^2)');
    result = result.replace(/(\d+\.?\d*)\s+\^3(?!\d)/g, '($1^3)');

    // Handle general power expressions "X to the power of Y"
    result = result.replace(/(\d+\.?\d*)\s*\^\s*(\d+\.?\d*)/g, '($1^$2)');
    
    // Handle function calls with parentheses
    result = result.replace(/sqrt\s*\(\s*(\d+\.?\d*)\s*\)/g, 'sqrt($1)');
    result = result.replace(/sqrt\s+(\d+\.?\d*)/g, 'sqrt($1)');
    result = result.replace(/cbrt\s*\(\s*(\d+\.?\d*)\s*\)/g, 'cbrt($1)');
    result = result.replace(/cbrt\s+(\d+\.?\d*)/g, 'cbrt($1)');
    result = result.replace(/abs\s*\(\s*(\d+\.?\d*)\s*\)/g, 'abs($1)');
    result = result.replace(/abs\s+(\d+\.?\d*)/g, 'abs($1)');
    result = result.replace(/sin\s*\(\s*(\d+\.?\d*)\s*\)/g, 'sin($1)');
    result = result.replace(/sin\s+(\d+\.?\d*)/g, 'sin($1)');
    result = result.replace(/cos\s*\(\s*(\d+\.?\d*)\s*\)/g, 'cos($1)');
    result = result.replace(/cos\s+(\d+\.?\d*)/g, 'cos($1)');
    result = result.replace(/tan\s*\(\s*(\d+\.?\d*)\s*\)/g, 'tan($1)');
    result = result.replace(/tan\s+(\d+\.?\d*)/g, 'tan($1)');
    result = result.replace(/fact\s*\(\s*(\d+)\s*\)/g, 'fact($1)');
    result = result.replace(/fact\s+(\d+)/g, 'fact($1)');
    result = result.replace(/log\s*\(\s*(\d+\.?\d*)\s*\)/g, 'log($1)');
    result = result.replace(/log\s+(\d+\.?\d*)/g, 'log($1)');
    result = result.replace(/ln\s*\(\s*(\d+\.?\d*)\s*\)/g, 'ln($1)');
    result = result.replace(/ln\s+(\d+\.?\d*)/g, 'ln($1)');
    result = result.replace(/floor\s*\(\s*(\d+\.?\d*)\s*\)/g, 'floor($1)');
    result = result.replace(/floor\s+(\d+\.?\d*)/g, 'floor($1)');
    result = result.replace(/ceil\s*\(\s*(\d+\.?\d*)\s*\)/g, 'ceil($1)');
    result = result.replace(/ceil\s+(\d+\.?\d*)/g, 'ceil($1)');
    result = result.replace(/round\s*\(\s*(\d+\.?\d*)\s*\)/g, 'round($1)');
    result = result.replace(/round\s+(\d+\.?\d*)/g, 'round($1)');

    // Insert implicit multiplication where needed, e.g., "4 sqrt 2" => "4*sqrt(2)",
    // or "2 (3+4)" => "2*(3+4)", or ") (" => ")*("
    result = result.replace(/(\d+|\))\s+(sqrt|cbrt|abs|sin|cos|tan|log|ln|floor|ceil|round|fact)\b/g, '$1*$2');
    result = result.replace(/(\d+|\))\s+\(/g, '$1*(');
    result = result.replace(/\)\s*(\d+)/g, ')*$1');

    // Handle compound numbers (e.g., "twenty three" -> "23")
    result = result.replace(/(\d{2,})\s+(\d{1,2})(?!\d)/g, '$1$2');

    return result;
  }

  private cleanExpression(text: string): string {
    let result = text
      .replace(/\s+/g, ' ')
      .replace(/\s*([+\-*/^%()=])\s*/g, '$1')
      .trim();

    result = result.replace(/([+\-*/^%]){2,}/g, '$1');

    result = result.replace(/=+$/, '');

    return result;
  }

  getInterpretation(text: string): string {
    const parsed = this.parse(text);
    return `"${text}" → ${parsed}`;
  }
}
