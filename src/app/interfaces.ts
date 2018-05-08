export interface ICsv extends Array<ICsvLine> {
  headers?: ICsvLine;
}

export interface ICsvLine {
  _originalValue: string;
  currentValue: string;
  values: Array<ICsvValue>;
  index: number;
  headers?: ICsvLineHeader;
}

export interface ICsvValue {
  _originalValue: string;
  value: string;
}

export interface ICsvLineHeader extends ICsvLine {
  regexps: Array<RegExp>;
}
