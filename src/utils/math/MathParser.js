// MathParser.js - Safe mathematical expression parser
export class MathParser {
    static evaluate(expression) {
        // Remove unsafe characters
        const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
        
        // Simple validation
        if (!/^[\d\s+\-*/().]+$/.test(safeExpression)) {
            throw new Error('Invalid mathematical expression');
        }

        // Use Function constructor instead of eval (safer but still not perfect)
        // For production, use a proper math library
        try {
            const result = new Function('return ' + safeExpression)();
            if (isNaN(result) || !isFinite(result)) {
                throw new Error('Invalid calculation result');
            }
            return result;
        } catch (error) {
            throw new Error('Calculation error: ' + error.message);
        }
    }
}