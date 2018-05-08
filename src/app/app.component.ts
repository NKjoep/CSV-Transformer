import { Component, HostListener } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ICsv, ICsvLine, ICsvValue, ICsvLineHeader } from './interfaces';
import * as escapeStringRegexp from 'escape-string-regexp';

const CsvSymbols = {
  LINE: '\n',
  SEPARATOR: ',',
  COMMA: ',',
  SEMI_COLUMN: ';',
  CR: '\r'
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent {
  isShowOldValues = false;
  separator = CsvSymbols.COMMA;
  hasHeaders = true;
  results: BehaviorSubject<ICsv> = new BehaviorSubject(null);

  constructor() {

  }

  doStuff(value: string) {
    const lines = this.extractLines(value);
    window['ll'] = lines;
    console.log(lines);
    this.results.next(lines);
  }

  onTemplate(template: string) {
    const lines = this.results.getValue();
    const updated = lines.map((line, lineIndex) => {
      line.currentValue = this.mutateValue(line, template, lineIndex);
      return line;
    });
    updated['headers'] = lines.headers;
    this.results.next(updated);
  }

  private mutateValue(line: ICsvLine, template: string, index: number|string = '{_index}'): string {
    const regIndex = new RegExp(escapeStringRegexp('{_index}'), 'g');
    let newValue = template.replace(regIndex, `${index}`);
    if (!line.headers) {
      return newValue;
    }
    line.headers.regexps.forEach((r, hIndex) => {
      if (!line.values[hIndex]) { return; }
      newValue = newValue.replace(r, line.values[hIndex].value);
    });
    return newValue;
  }

  private extractLines(rawString: string): ICsv {
    const headers = this.extractHeaders(rawString);
    const l = rawString.split(CsvSymbols.LINE)
      .map((line, index) => this.extractValues(line, index, headers));
    l['headers'] = headers;
    return l;
  }

  private extractHeaders(rawString: string): ICsvLineHeader {
    const breakPost = rawString.indexOf(CsvSymbols.LINE);
    const line = rawString.substring(0, breakPost);
    const h = this.extractValues(line, 0);
    const regexps = h.values.map((hvalue) => {
      return new RegExp(escapeStringRegexp(`{${hvalue.value}}`), 'g');
    });
    return Object.assign({}, h, { regexps: regexps });
  }

  private extractValues(line: string, index?: number, headers?: ICsvLineHeader): ICsvLine {
    const lineValue = line.split(this.separator).reduce((values, value) => {
      values.push({
        _originalValue: value,
        value: value.trim()
      });
      return values;
    }, []);
    return {
      _originalValue: line,
      index: index || undefined,
      values: lineValue,
      currentValue: line.trim(),
      headers: headers
    };
  }

}
