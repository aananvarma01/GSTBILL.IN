
const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertLessThanOneThousand(n: number): string {
    let result = '';
    if (n >= 100) {
        result += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
    }
    if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
    }
    if (n >= 10) {
        result += teens[n - 10] + ' ';
        n = 0;
    }
    if (n > 0) {
        result += units[n] + ' ';
    }
    return result;
}

export function numberToWords(num: number): string {
    if (isNaN(num) || num === 0) return 'Zero Rupees Only';
    if (num < 0) return 'Minus ' + numberToWords(Math.abs(num));

    const roundedNum = Math.round(num * 100) / 100;
    let integerPart = Math.floor(roundedNum);
    const decimalPart = Math.round((roundedNum - integerPart) * 100);

    let result = '';
    if (integerPart >= 10000000) {
        result += convertLessThanOneThousand(Math.floor(integerPart / 10000000)) + 'Crore ';
        integerPart %= 10000000;
    }
    if (integerPart >= 100000) {
        result += convertLessThanOneThousand(Math.floor(integerPart / 100000)) + 'Lakh ';
        integerPart %= 100000;
    }
    if (integerPart >= 1000) {
        result += convertLessThanOneThousand(Math.floor(integerPart / 1000)) + 'Thousand ';
        integerPart %= 1000;
    }
    result += convertLessThanOneThousand(integerPart);

    result = result.trim() + ' Rupees';

    if (decimalPart > 0) {
        result += ' and ' + convertLessThanOneThousand(decimalPart).trim() + ' Paise';
    }

    return result.replace(/\s+/g, ' ').trim() + ' Only';
}
