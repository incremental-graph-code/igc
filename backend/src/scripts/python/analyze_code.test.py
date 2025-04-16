import unittest
from analyze_code import analyze_code

def sort_analysis_result(result):
    for key in result['dependencies']:
        result['dependencies'][key].sort()
    for key in result['new_definitions']:
        result['new_definitions'][key].sort()
    return result

class TestAnalyzeCode(unittest.TestCase):

    # Empty and Malformed Code
    def test_empty_code(self):
        code = ""
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    def test_malformed_code(self):
        code = "def foo("
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        try:
            result = analyze_code(code)
        except SyntaxError:
            result = expected_output
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Definitions
    def test_variable_definition(self):
        code = "x = 1"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["x"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    def test_multiple_variable_definition(self):
        code = "x = 1\ny = 2\nz = 3"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["x", "y", "z"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    def test_multiple_variable_definition_overlap(self):
        code = "x = 1\ny = 2\nx = 3"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["x", "y"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_function_definition(self):
        code = "def foo():\n    pass"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": ["foo"], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_function_with_parameters(self):
        code = "def foo(param1, param2):\n    pass"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": ["foo"], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_class_definition(self):
        code = "class MyClass:\n    pass"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": ["MyClass"]},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_method_definition(self):
        code = "class MyClass:\n    def method(self):\n        pass"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": ["MyClass.method"], "classes": ["MyClass"]},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    def test_method_with_parameters(self):
        code = "class MyClass:\n    def method(self, param1, param2):\n        pass"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": ["MyClass.method"], "classes": ["MyClass"]},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_builtin_function(self):
        code = "print('Hello, world!')"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Dependencies
    def test_variable_dependency(self):
        code = "print(x)"
        expected_output = {
            "dependencies": {
                "variables": ["x"],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_function_dependency_alone(self):
        code = "foo()"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": ["foo"],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    def test_function_dependency(self):
        code = "result = foo()"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": ["foo"],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["result[foo]"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_class_dependency_alone(self):
        code = "Animal('Bob')"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": ["Animal.__init__"],
                "classes": ["Animal"],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_class_dependency(self):
        code = "animal = Animal('Bob')"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": ["Animal.__init__"],
                "classes": ["Animal"],
                "modules": [],
            },
            "new_definitions": {"variables": ["animal[Animal]"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_class_dependency2(self):
        code = "animal = Animal('Bob')\nprint(animal.getName())"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": ["Animal.__init__", "Animal.getName"],
                "classes": ["Animal"],
                "modules": [],
            },
            "new_definitions": {"variables": ["animal[Animal]"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    def test_class_dependency3(self):
        code = "print(animal.getName())"
        expected_output = {
            "dependencies": {
                "variables": ["animal"],
                "functions": ["<animal>.getName"],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_class_dependency4(self):
        code = "animal = Animal('Bob')\nanimal = Dog('Scott')\nprint(animal.getName())"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": ["Animal.__init__", "Dog.__init__", "Dog.getName"],
                "classes": ["Animal", "Dog"],
                "modules": [],
            },
            "new_definitions": {"variables": ["animal[Dog]"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_class_dependency5(self):
        code = "animal = Animal('Bob')\nprint(animal.getName())\nanimal = Dog('Scott')"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": ["Animal.__init__", "Animal.getName", "Dog.__init__"],
                "classes": ["Animal", "Dog"],
                "modules": [],
            },
            "new_definitions": {"variables": ["animal[Dog]"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    def test_class_dependency6(self):
        code = "animal = Animal('Bob')\nanimal = x\nprint(animal.getName())"
        expected_output = {
            "dependencies": {
                "variables": ["x"],
                "functions": ["<x>.getName", "Animal.__init__"],
                "classes": ["Animal"],
                "modules": [],
            },
            "new_definitions": {"variables": ["animal[<x>]"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_import_dependency(self):
        code = "import os"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": ["os"],
            },
            "new_definitions": {"variables": ["os"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_import_as_dependency(self):
        code = "import os as special_os"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": ["os"],
            },
            "new_definitions": {"variables": ["special_os"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_import_from_dependency(self):
        code = "from urllib import request"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": ["urllib"],
            },
            "new_definitions": {"variables": ["request"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_import_as_from_dependency(self):
        code = "from urllib import request as req"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": ["urllib"],
            },
            "new_definitions": {"variables": ["req"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Definition and then Usage
    def test_variable_definition_and_usage(self):
        code = "x = 1\nprint(x)"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["x"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_function_definition_and_usage(self):
        code = "def foo():\n    pass\nfoo()"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": ["foo"], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_class_definition_and_usage1(self):
        code = "class Animal:\n    def __init__(self, name):\n        self.name = name\nanimal = Animal('Bob')"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["animal[Animal]"], "functions": ["Animal.__init__"], "classes": ["Animal"]},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_class_definition_and_usage2(self):
        code = "class Animal:\n    pass\nanimal = Animal()"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["animal[Animal]"], "functions": [], "classes": ["Animal"]},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Dependency before Definition
    def test_variable_dependency_before_definition(self):
        code = "print(x)\nx = 1"
        expected_output = {
            "dependencies": {
                "variables": ["x"],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["x"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    def test_variable_dependency_before_definition2(self):
        code = "x = x + 1"
        expected_output = {
            "dependencies": {
                "variables": ["x"],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["x"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_variable_dependency_before_definition3(self):
        code = "x += 1"
        expected_output = {
            "dependencies": {
                "variables": ["x"],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["x"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_function_dependency_before_definition(self):
        code = "foo()\ndef foo():\n    pass"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": ["foo"],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": ["foo"], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_class_dependency_before_definition(self):
        code = "animal = Animal('Bob')\nclass Animal:\n    def __init__(self, name):\n        self.name = name"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": ["Animal.__init__"],
                "classes": ["Animal"],
                "modules": [],
            },
            "new_definitions": {"variables": ["animal[Animal]"], "functions": ["Animal.__init__"], "classes": ["Animal"]},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    # MISC Usage
    def test_class_usage1(self):
        code = "animal = Animal()"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": ["Animal"],
                "modules": [],
            },
            "new_definitions": {"variables": ["animal[Animal]"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_class_usage2(self):
        code = "animal = Animal('Bob')"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": ["Animal.__init__"],
                "classes": ["Animal"],
                "modules": [],
            },
            "new_definitions": {"variables": ["animal[Animal]"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_misc_for_loop(self):
        code = "for i in range(10):\n    print(i)"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    def test_misc_nested_for_loop(self):
        code = "for i in range(10):\n    for j in range(5):\n        print(i, j)"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    def test_misc_for_loop_tuple(self):
        code = "for key, value in locals().items():\n    print(key)"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    def test_misc_while_loop(self):
        code = "i = 0\nwhile i < 10:\n    print(i)\n    i += 1"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["i"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for a nested while loop
    def test_misc_nested_while_loop(self):
        code = "i = 0\nj = 0\nwhile i < 10:\n    while j < 5:\n        print(i, j)\n        j += 1\n    i += 1"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["i", "j"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for a for loop with a class method call inside
    def test_misc_for_loop_with_class_method_call(self):
        code = "class MyClass:\n    def method(self, x):\n        return x * 2\nobj = MyClass()\nfor i in range(10):\n    print(obj.method(i))"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["obj[MyClass]"], "functions": ["MyClass.method"], "classes": ["MyClass"]},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for a for loop in a function call inside
    def test_misc_for_loop_with_function_call(self):
        code = "def add_code_to_class(cls):\n    for key, value in locals().items():\n        if key != 'cls':\n            setattr(cls, key, value)"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": ["add_code_to_class"], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for a while loop with a break statement
    def test_misc_while_loop_with_break(self):
        code = "i = 0\nwhile True:\n    if i >= 10:\n        break\n    print(i)\n    i += 1"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["i"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for a while loop with a continue statement
    def test_misc_while_loop_with_continue(self):
        code = "i = 0\nwhile i < 10:\n    i += 1\n    if i % 2 == 0:\n        continue\n    print(i)"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["i"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)
    
    # Test case for a while loop with dependency
    def test_misc_while_loop_with_continue(self):
        code = "while i < 10:\n    i += 1\n    if i % 2 == 0:\n        continue\n    print(i)"
        expected_output = {
            "dependencies": {
                "variables": ["i"],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["i"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for deleting a variable
    def test_del_variable(self):
        code = "x = 1\ndel x"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for deleting multiple variables
    def test_del_multiple_variables(self):
        code = "x = 1\ny = 2\ndel x, y"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for deleting an attribute of an object
    def test_del_attribute(self):
        code = "class A:\n    pass\na = A()\na.attr = 1\ndel a.attr"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["a[A]"], "functions": [], "classes": ["A"]},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for deleting an item from a list
    def test_del_list_item(self):
        code = "lst = [1, 2, 3]\ndel lst[0]"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["lst"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for deleting a variable inside a function
    def test_del_variable_in_function(self):
        code = "def foo():\n    x = 1\n    del x"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": ["foo"], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for deleting a function
    def test_del_function(self):
        code = "def foo():\n    pass\ndel foo"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for deleting a class
    def test_del_class(self):
        code = "class A:\n    pass\ndel A"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": [], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

    # Test case for deleting an element in a nested structure
    def test_del_nested_element(self):
        code = "lst = [[1, 2], [3, 4]]\ndel lst[0][1]"
        expected_output = {
            "dependencies": {
                "variables": [],
                "functions": [],
                "classes": [],
                "modules": [],
            },
            "new_definitions": {"variables": ["lst"], "functions": [], "classes": []},
        }
        result = analyze_code(code)
        self.assertEqual(sort_analysis_result(result), expected_output)

if __name__ == "__main__":
    unittest.main(verbosity=2)
