import { Component, ViewChild } from '@angular/core';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import * as escapeStringRegexp from 'escape-string-regexp';
import { BehaviorSubject } from 'rxjs';
import { ICsv, ICsvLine, ICsvLineHeader } from './interfaces';

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
  results: BehaviorSubject<MatTableDataSource<ICsvLine>> = new BehaviorSubject(new MatTableDataSource<ICsvLine>([]));

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor() {

  }

  doStuff(value: string) {
    const lines = this.extractLines(value);
    window['ll'] = lines;
    console.log(lines);
    this.setValues(lines);
  }

  setValues(lines: ICsv) {
    const v = new MatTableDataSource<ICsvLine>(lines);
    v.paginator = this.paginator;
    this.results.next(v);
  }

  onTemplate(template: string) {
    const lines = this.results.getValue().data;
    const updated = lines.map((line, lineIndex) => {
      line.currentValue = this.mutateValue(line, template, lineIndex);
      return line;
    });

    const line1 = lines[1];
    if (line1 && line1.headers) {
      updated['headers'] = line1.headers;
    }
    this.setValues(updated);
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
      .map((line, index) => this.extractValues(line, index, headers))
      .filter(line => line._originalValue.trim().length);
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
