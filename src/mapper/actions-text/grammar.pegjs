{
    function unescape(value) {
        return value.map(i => i.length > 1 ? (i[1] === '_' ? '' : i[1]) : i[0]).join('');
    }
}

Actions = actions:Action* (NL / WS)*
{ return actions; }

Action = (NL / WS)* sources:(Source WS)+ "->" WS target:Target
transformation:(WS ":" WS Transformation)?
    { return { sources: sources.map(i => i[0]), target, transformation: transformation? transformation[3] : null, location: location() }; }

Source = AttributeReference / Constant

Target = AttributeReference

AttributeReference = kind:Kind "." path:Path
{ return { type: "attributeReference", kind, path, location: location() }; }

Transformation = name:Identifier parameters:(WS ConstantValue)*
{ return { name, parameters: parameters.map(i => i[1]), location: location() }; }

Kind = "header" / "body" / "property"

Path = head:Identifier tail:("." Identifier)*
{ return [head, ...tail.map(i => i[1])]; }

Constant = "constant" "." name:ConstantValue
{ return { type: "constant", name, location: location() }; }

Identifier "identifier" = value:([^ .\t\r\n\\] / "\\" [ .\t\r\n\\_])+
{ return unescape(value); }

ConstantValue "constantValue" = value:([^ \t\r\n\\] / "\\" [ \t\r\n\\_])+
{ return unescape(value); }

NL "newline" = [\r\n]

WS "whitespace" = [ \t]+


