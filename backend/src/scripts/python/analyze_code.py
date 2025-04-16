import ast
import json
import builtins

def analyze_code(code):
    tree = ast.parse(code)

    dependencies = {
        "variables": set(),
        "functions": set(),
        "classes": set(),
        "modules": set(),
    }
    new_definitions = {"variables": set(), "functions": set(), "classes": set()}
    variable_types = {}
    newly_defined_type_variables = {}

    class DependencyVisitor(ast.NodeVisitor):
        def __init__(self):
            super().__init__()
            self.current_scope = [set()]
            self.current_class = None
            self.builtins = set(dir(builtins))

        def visit_Name(self, node):
            if isinstance(node.ctx, ast.Load):
                if (
                    node.id not in self.builtins
                    and node.id not in self.current_scope[-1]
                    and node.id not in new_definitions["variables"]
                    and node.id not in new_definitions["functions"]
                    and node.id not in new_definitions["classes"]
                    and not self.child_of_call(node)
                ):
                    dependencies["variables"].add(f"{node.id}")
            elif isinstance(node.ctx, ast.Store):
                # Check for previously defined variable types
                if node.id in variable_types:
                    newly_defined_type_variables[node.id] = variable_types[node.id]
                else:
                    new_definitions["variables"].add(f"{node.id}")
                self.current_scope[-1].add(node.id)

        def child_of_call(self, node):
            parent = getattr(node, 'parent', None)
            if isinstance(parent, ast.Call) and parent.func.id == node.id:
                return True
            return False

        def visit_FunctionDef(self, node):
            func_name = f"{self.current_class}.{node.name}" if self.current_class else node.name
            new_definitions["functions"].add(func_name)
            self.current_scope.append({arg.arg for arg in node.args.args})
            self.generic_visit(node)
            self.current_scope.pop()

        def visit_ClassDef(self, node):
            self.current_class = node.name
            new_definitions["classes"].add(node.name)
            self.current_scope.append(set())
            self.generic_visit(node)
            self.current_scope.pop()
            self.current_class = None

        def visit_Import(self, node):
            for alias in node.names:
                dependencies["modules"].add(alias.name.split(".")[0])
                new_definitions["variables"].add(alias.asname or alias.name.split(".")[0])

        def visit_ImportFrom(self, node):
            dependencies["modules"].add(node.module.split(".")[0])
            for alias in node.names:
                new_definitions["variables"].add(alias.asname or alias.name)

        def visit_Assign(self, node):
            if isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name):
                # Track variable types
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        variable_types[target.id] = node.value.func.id
            elif isinstance(node.value, ast.Name):
                # Track variable types
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        variable_types[target.id] = f"<{node.value.id}>"
                
            self.visit(node.value)
            for target in node.targets:
                self.visit(target)

        def visit_AugAssign(self, node):
            if isinstance(node.target, ast.Name) and node.target.id not in self.current_scope[-1]:
                dependencies["variables"].add(f"{node.target.id}")
            self.visit(node.value)
            self.visit(node.target)

        def visit_Call(self, node):
            if isinstance(node.func, ast.Name):
                if (
                    node.func.id not in self.builtins
                    and node.func.id not in self.current_scope[-1]
                    and (node.func.id not in new_definitions["functions"] and node.func.id not in new_definitions["classes"])
                ):
                    if node.func.id[0].isupper():
                        dependencies["classes"].add(node.func.id)
                        if len(node.args) != 0:
                            dependencies["functions"].add(f"{node.func.id}.__init__")

                    else:
                        dependencies["functions"].add(node.func.id)
            elif isinstance(node.func, ast.Attribute):
                if (
                    isinstance(node.func.value, ast.Name)
                    and node.func.value.id not in self.builtins
                ):
                    var_type = variable_types.get(node.func.value.id)
                    if var_type:
                        if f"{var_type}.{node.func.attr}" not in new_definitions["functions"]:
                            dependencies["functions"].add(f"{var_type}.{node.func.attr}")
                    else:
                        if f"<{node.func.value.id}>.{node.func.attr}" not in new_definitions["functions"]:
                            dependencies["variables"].add(f"{node.func.value.id}")
                            dependencies["functions"].add(f"<{node.func.value.id}>.{node.func.attr}")
            self.generic_visit(node)

        def visit_Attribute(self, node):
            if isinstance(node.value, ast.Name) and node.value.id not in self.builtins and node.value.id not in self.current_scope[-1]:
                dependencies["variables"].add(f"{node.value.id}")
            self.generic_visit(node)

        def visit_For(self, node):
            if isinstance(node.target, ast.Name):
                self.current_scope[-1].add(node.target.id)
            elif isinstance(node.target, ast.Tuple):
                for elt in node.target.elts:
                    if isinstance(elt, ast.Name):
                        self.current_scope[-1].add(elt.id)
            self.visit(node.iter)
            for stmt in node.body:
                self.visit(stmt)

        def visit_While(self, node):
            self.visit(node.test)
            for n in node.body:
                self.visit(n)
            for n in node.orelse:
                self.visit(n)

        def visit_Delete(self, node):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    if target.id in new_definitions["variables"]:
                        new_definitions["variables"].remove(f"{target.id}")
                    elif target.id in new_definitions["functions"]:
                        new_definitions["functions"].remove(f"{target.id}")
                    elif target.id in new_definitions["classes"]:
                        new_definitions["classes"].remove(f"{target.id}")
                    if target.id in newly_defined_type_variables:
                        newly_defined_type_variables.pop(target.id)
                    if target.id in variable_types:
                        variable_types.pop(target.id)
                self.visit(target)

        def generic_visit(self, node):
            for child in ast.iter_child_nodes(node):
                child.parent = node
            super().generic_visit(node)

    DependencyVisitor().visit(tree)

    for var, var_type in newly_defined_type_variables.items():
        new_definitions["variables"].add(f"{var}[{var_type}]")

    dependencies = {k: list(v) for k, v in dependencies.items()}
    new_definitions = {k: list(v) for k, v in new_definitions.items()}

    return {"dependencies": dependencies, "new_definitions": new_definitions}

if __name__ == "__main__":
    import sys

    code = sys.stdin.read()
    result = analyze_code(code)
    print(json.dumps(result))
