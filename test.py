import pandas as pd
from ID3 import DecisionTree
import json
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.preprocessing import OrdinalEncoder
import matplotlib.pyplot as plt


data = pd.read_csv('samples/sample_data_v2.csv')


X = data.drop("BuysProduct", axis=1)

column_list = list(X.columns)
y = data["BuysProduct"]

x= ["Age", "Income"]

print(data[x])



# tree = DecisionTree(max_depth=1, min_samples_split=20)
# tree.fit(data, column_list, 'Label')

# json_tree = json.loads(tree.to_json())
# json_tree = json_tree["tree"]


def traverse_json(data, level=1):
    print(level)
    if isinstance(data, dict):
        node_value = data.get("feature")

        if node_value is not None:
            print(f"Splitting_Node:{node_value}")

        children = data.get("children")

        if data["type"] != "leaf":
            print(children.keys())
        print(data['class_distribution'])

        for child in children:
            z = children[child]
            level += 1
            traverse_json(z, level)


# traverse_json(json_tree)



