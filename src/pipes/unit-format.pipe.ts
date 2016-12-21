import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'unitFormat'
})
export class UnitFormatPipe implements PipeTransform {

    transform(value: number, baseUnit: string): string {
        if (value === 0) {
            return '0.000 V';
        }
        let i = 0;
        let unit: string = ' ' + baseUnit;

        while (Math.abs(value) < 1 && i < 3) {
            i++;
            value = value * 1000;
        }

        let valueCopyString = value.toString();
        let maxStringLength = value < 0 ? 5 : 4;
        let numDigitsBeforeDecimal = valueCopyString.indexOf('.');
        numDigitsBeforeDecimal = numDigitsBeforeDecimal === -1 ? valueCopyString.length : numDigitsBeforeDecimal;
        let toFixedParam = maxStringLength - numDigitsBeforeDecimal;
        toFixedParam = toFixedParam < 0 ? 0 : toFixedParam;

        valueCopyString = value.toFixed(toFixedParam);

        if (i == 0) {
            unit = ' ';
        }
        else if (i == 1) {
            unit = ' m';
        }
        else if (i == 2) {
            unit = ' u';
        }
        else if (i == 3) {
            unit = ' n';
        }
        return valueCopyString + unit + baseUnit;
    }
}