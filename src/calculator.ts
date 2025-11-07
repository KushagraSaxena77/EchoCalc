export class Calculator {
  evaluate(expression: string): number {
    try {
      let processedExpression = expression;

      processedExpression = this.handlePowerOperator(processedExpression);
      processedExpression = this.handleMathFunctions(processedExpression);

      const result = this.safeEvaluate(processedExpression);

      if (isNaN(result) || !isFinite(result)) {
        throw new Error('Invalid calculation result');
      }

      return this.roundResult(result);
    } catch (error) {
      throw new Error('Unable to calculate expression');
    }
  }

  private handlePowerOperator(expression: string): string {
    return expression.replace(/(\d+\.?\d*)\^(\d+\.?\d*)/g, 'Math.pow($1,$2)');
  }

  private handleMathFunctions(expression: string): string {
    let result = expression;

    result = result.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
    result = result.replace(/cbrt\(([^)]+)\)/g, '__cbrt($1)');
    result = result.replace(/abs\(([^)]+)\)/g, 'Math.abs($1)');
    result = result.replace(/sin\(([^)]+)\)/g, 'Math.sin($1)');
    result = result.replace(/cos\(([^)]+)\)/g, 'Math.cos($1)');
    result = result.replace(/tan\(([^)]+)\)/g, 'Math.tan($1)');
    result = result.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
    result = result.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
    result = result.replace(/floor\(([^)]+)\)/g, 'Math.floor($1)');
    result = result.replace(/ceil\(([^)]+)\)/g, 'Math.ceil($1)');
    result = result.replace(/round\(([^)]+)\)/g, 'Math.round($1)');
    result = result.replace(/fact\(([^)]+)\)/g, '__fact($1)');

    return result;
  }

  private factorial(n: number): number {
    if (n < 0) throw new Error('Factorial not defined for negative numbers');
    if (!Number.isInteger(n)) throw new Error('Factorial only defined for integers');
    if (n > 170) throw new Error('Factorial overflow');

    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  private safeEvaluate(expression: string): number {
    const sanitized = expression
      // Allow comma for Math.pow(3,2) and caret if it ever remains prior to replacement
      .replace(/[^0-9+\-*/.,()%\s_a-zA-Z^]/g, '');

    if (sanitized.length === 0) {
      throw new Error('Empty expression');
    }

    const helpers = {
      __cbrt: (x: number) => Math.cbrt(x),
      __fact: this.factorial.bind(this),
    };

    return Function(
      'Math',
      '__cbrt',
      '__fact',
      `"use strict"; return (${sanitized})`
    )(Math, helpers.__cbrt, helpers.__fact);
  }

  private roundResult(num: number): number {
    return Math.round(num * 1000000) / 1000000;
  }

  formatResult(num: number): string {
    if (Number.isInteger(num)) {
      return num.toString();
    }

    if (Math.abs(num) >= 1000000 || (Math.abs(num) < 0.0001 && num !== 0)) {
      return num.toExponential(4);
    }

    const str = num.toFixed(6);
    return parseFloat(str).toString();
  }
}
