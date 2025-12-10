KeyValuePairs = _ pairs:(KeyValuePair _)* {
    return pairs.map(i => i[0]);
}

KeyValuePair = key:Key "=" value:Value ";" {
    return { key, value };
}

Key = Token

Value = Token

Token = value:([^=;\\] / "\\" [=;\\])* {
    return value.map(i => i.length > 1 ? i[1] : i[0]).join('');
}

_ "whitespace"
  = [ \t\n\r]*


