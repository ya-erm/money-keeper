// Original source:
// https://github.com/ya-erm/calculator-react/blob/dev/src/model/CalculationToken.ts

type ICalculationTokenType =
  | 'plus'
  | 'minus'
  | 'multiply'
  | 'divide'
  | 'mod'
  | 'pow'
  | 'leftBracket'
  | 'rightBracket'
  | 'number';

export class CalculationToken {
  type: ICalculationTokenType;
  value?: string;

  constructor(type: ICalculationTokenType, value?: string) {
    this.type = type;
    this.value = value;
  }

  static parse(text: string) {
    switch (text) {
      case '+':
        return new this('plus', text);
      case '-':
        return new this('minus', text);
      case '*':
        return new this('multiply', text);
      case '/':
        return new this('divide', text);
      case '%':
        return new this('mod', text);
      case '^':
        return new this('pow', text);
      case '(':
        return new this('leftBracket', text);
      case ')':
        return new this('rightBracket', text);

      default:
        if (isNaN(Number.parseFloat(text))) {
          throw new Error(`Can't parse "${text}" as number token`);
        }
        return new this('number', text);
    }
  }

  canBeAfter = (previous?: CalculationToken) => {
    if (previous == null) {
      return this.canBeFirst();
    }
    switch (this.type) {
      case 'leftBracket':
      case 'number':
        switch (previous.type) {
          case 'rightBracket':
          case 'number':
            return false;
          default:
            return true;
        }
      case 'multiply':
      case 'divide':
      case 'mod':
      case 'pow':
      case 'rightBracket':
        switch (previous.type) {
          case 'rightBracket':
          case 'number':
            return true;
          default:
            return false;
        }
      case 'plus':
      case 'minus':
        switch (previous.type) {
          case 'leftBracket':
          case 'rightBracket':
          case 'number':
            return true;
          default:
            return false;
        }
    }
  };

  canBeFirst = () => {
    switch (this.type) {
      case 'plus':
      case 'minus':
      case 'leftBracket':
      case 'number':
        return true;
      case 'multiply':
      case 'divide':
      case 'mod':
      case 'pow':
      case 'rightBracket':
        return false;
    }
  };

  canBeLast = () => {
    switch (this.type) {
      case 'rightBracket':
      case 'number':
        return true;
      default:
        return false;
    }
  };

  canBeUnary = () => {
    switch (this.type) {
      case 'minus':
      case 'plus':
        return true;
      default:
        return false;
    }
  };

  isNumber = () => this.type === 'number';

  leftPriority = () => {
    switch (this.type) {
      case 'plus':
      case 'minus':
        return 2;
      case 'multiply':
      case 'divide':
      case 'mod':
        return 4;
      case 'pow':
        return 5;
      default:
        return 0;
    }
  };

  rightPriority = () => {
    switch (this.type) {
      case 'plus':
      case 'minus':
        return 1;
      case 'multiply':
      case 'divide':
      case 'mod':
        return 3;
      case 'pow':
        return 6;
      default:
        return 0;
    }
  };
}
