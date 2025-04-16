import { Monaco } from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor";

const registeredProviders: monacoEditor.IDisposable[] = [];

export const disposeAllProviders = () => {
	registeredProviders.forEach((provider) => provider.dispose());
	registeredProviders.length = 0; // Clear the array
};

const registerSnippetProvider = (
	language: string,
	suggestions: monacoEditor.languages.CompletionItem[],
	monaco: Monaco,
) => {
	const provider = monaco.languages.registerCompletionItemProvider(language, {
		provideCompletionItems: () => {
			return { suggestions: suggestions };
		},
	});

	registeredProviders.push(provider);
};

export const showSuggestionSnippet = (
	nodeType: string | null,
	language: string,
	monaco: Monaco,
	editor: any,
): void => {
	// Get rid of previous snippet templates
	disposeAllProviders();

	// Position of the cursor
	const position = editor.getPosition();
	const range = new monacoEditor.Range(
		position.lineNumber,
		position.column,
		position.lineNumber,
		position.column,
	);

	// Create the snippets
	const suggestions = getSuggestions(nodeType, language, monaco, range);
	registerSnippetProvider(language, suggestions, monaco);

	// Show the snippets
	if (suggestions.length > 0) {
		editor.trigger("anyString", "editor.action.triggerSuggest", {});
	}
};

export const getSuggestions = (
	nodeType: string | null,
	language: string,
	monaco: Monaco,
	range: monacoEditor.Range,
): monacoEditor.languages.CompletionItem[] => {
	if (language in allSuggestions) {
		const suggestions = allSuggestions[language as keyof AllSuggestions];

		if (nodeType !== null && nodeType in suggestions) {
			return (suggestions as any)[nodeType].flatMap((node: Node) =>
				Object.entries(node).map(([label, insertText]) =>
					makeSuggestion(label, insertText, monaco, range),
				),
			);
		}

		// Return all suggestions if nodeType is null
		return Object.values(suggestions).flatMap(
			(nodes: NodeTypeSuggestion[]) =>
				nodes.flatMap((node: NodeTypeSuggestion) =>
					Object.entries(node).map(([label, insertText]) =>
						makeSuggestion(label, insertText, monaco, range),
					),
				),
		);
	}
	return [];
};

const makeSuggestion = (
	label: string,
	insertText: string[],
	monaco: Monaco,
	range: monacoEditor.Range,
): monacoEditor.languages.CompletionItem => {
	return {
		label: label,
		kind: monaco.languages.CompletionItemKind.Snippet,
		insertText: insertText.join("\n"),
		insertTextRules:
			monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
		documentation: `${label} template`,
		range: range,
	};
};

type Suggestion = string[];

interface NodeTypeSuggestion {
	[label: string]: Suggestion;
}

interface LanguageSuggestions {
	[nodeType: string]: NodeTypeSuggestion[];
}

interface AllSuggestions {
	[language: string]: LanguageSuggestions;
}

const allSuggestions: AllSuggestions = {
	python: {
		classNode: [
			{
				Class: [
					"class ${1:ClassName}:",
					'\t"""',
					"\t${2:Class docstring}",
					'\t"""',
                    '\t${3:pass}',
				],
			},
			{
				"Class (Without Docstrings)": [
					"class ${1:ClassName}:",
					"\t${2:pass}",
				],
			},
			{
				Enum: [
					"class ${1:EnumName}(Enum):",
					'\t"""',
					"\t${2:Enum docstring}",
					'\t"""',
					"\t${3:VALUE1} = ${4:1}",
					"\t${5:VALUE2} = ${6:2}",
				],
			},
			{
				"Enum (Without Docstrings)": [
					"class ${1:EnumName}(Enum):",
					"\t${2:VALUE1} = ${3:1}",
					"\t${4:VALUE2} = ${5:2}",
				],
			},
		],
		abstractClassNode: [
			{
				"Abstract Class": [
					"class ${1:ClassName}(ABC):",
					'\t"""',
					"\t${2:Class docstring}",
					'\t"""',
				],
			},
			{
				"Abstract Class (Without Docstrings)": [
					"class ${1:ClassName}(ABC):",
				],
			},
		],
		interfaceNode: [
			{
				Interface: [
					"class ${1:InterfaceName}(ABC):",
					'\t"""',
					"\t${2:Interface docstring}",
					'\t"""',
				],
			},
			{
				"Interface (Without Docstrings)": [
					"class ${1:InterfaceName}(ABC):",
				],
			},
		],
		libraryNode: [
			{
				"Import Library": ["import ${1:library_name}"],
			},
			{
				"Import Library with Alias": [
					"import ${1:library_name} as ${2:alias}",
				],
			},
		],
		methodNode: [
			{
				"Static Method": [
					"@staticmethod",
					"def ${1:method_name}(${2:args}):",
					'\t"""',
					"\t${3:Method docstring}",
					'\t"""',
					"\t${4:pass}",
				],
				"Static Method (Without Docstrings)": [
					"@staticmethod",
					"def ${1:method_name}(${2:args}):",
					"\t${3:pass}",
				],
				"Instance Method": [
					"def ${1:method_name}(self, ${2:args}):",
					'\t"""',
					"\t${3:Method docstring}",
					'\t"""',
					"\t${4:pass}",
				],
				"Instance Method (Without Docstrings)": [
					"def ${1:method_name}(self, ${2:args}):",
					"\t${3:pass}",
				],
				"Abstract Method": [
					"@abstractmethod",
					"def ${1:method_name}(self, ${2:args}):",
					'\t"""',
					"\t${3:Method docstring}",
					'\t"""',
					"\t${4:pass}",
				],
				"Abstract Method (Without Docstrings)": [
					"@abstractmethod",
					"def ${1:method_name}(self, ${2:args}):",
					"\t${3:pass}",
				],
				"Constructor Method": [
					"def __init__(self, ${1:args}):",
					'\t"""',
					"\tConstructor method.",
					'\t"""',
					"\t${2:pass}",
				],
				"Constructor Method (Without Docstrings)": [
					"def __init__(self, ${1:args}):",
					"\t${2:pass}",
				],
				"Destructor Method": [
					"def __del__(self):",
					'\t"""',
					"\tDestructor method.",
					'\t"""',
					"\t${1:pass}",
				],
				"Destructor Method (Without Docstrings)": [
					"def __del__(self):",
					"\t${1:pass}",
				],
				"Accessor Method": [
					"@property",
					"def ${1:property_name}(self):",
					'\t"""',
					"\tAccessor method for ${1:property_name}.",
					'\t"""',
					"\treturn self._${1:property_name}",
				],
				"Accessor Method (Without Docstrings)": [
					"@property",
					"def ${1:property_name}(self):",
					"\treturn self._${1:property_name}",
				],
				"Mutator Method": [
					"@${1:property_name}.setter",
					"def ${1:property_name}(self, value):",
					'\t"""',
					"\tMutator method for ${1:property_name}.",
					'\t"""',
					"\tself._${1:property_name} = value",
				],
				"Mutator Method (Without Docstrings)": [
					"@${1:property_name}.setter",
					"def ${1:property_name}(self, value):",
					"\tself._${1:property_name} = value",
				],
				"Class Method": [
					"@classmethod",
					"def ${1:method_name}(cls, ${2:args}):",
					'\t"""',
					"\t${3:Method docstring}",
					'\t"""',
					"\t${4:pass}",
				],
				"Class Method (Without Docstrings)": [
					"@classmethod",
					"def ${1:method_name}(cls, ${2:args}):",
					"\t${3:pass}",
				],
			},
		],
		codeFragmentNode: [],
	},
};
