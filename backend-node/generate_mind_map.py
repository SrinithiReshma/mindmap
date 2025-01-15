import pydot
from PIL import Image, ImageOps
import re
import firebase_admin
from firebase_admin import credentials, storage
import os
import io

print('generate_mind_map.py has started...')

# Initialize Firebase Admin SDK
cred = credentials.Certificate('../backend/serviceAccountKey.json')  # Provide path to your Firebase service account key
firebase_admin.initialize_app(cred, {
    'storageBucket': 'mindmapwebsitepdf.appspot.com'  # Provide your Firebase storage bucket name
})

def wrap_text(text, max_length=20):
    print(f'Wrapping text: {text[:50]}...')
    """Wrap the text into multiple lines based on max_length."""
    words = text.split()
    wrapped_lines = []
    current_line = ""

    for word in words:
        if len(current_line) + len(word) + 1 <= max_length:
            current_line += " " + word if current_line else word
        else:
            wrapped_lines.append(current_line)
            current_line = word
    wrapped_lines.append(current_line)

    return "\n".join(wrapped_lines)

def count_indentation(line):
    """Count the leading spaces in the line to determine its indentation level."""
    return len(line) - len(line.lstrip())

def build_tree_from_text(lines):
    tree = pydot.Dot(graph_type='digraph', rankdir='TB')  # Top-to-bottom layout
    node_stack = []  # Stack to manage parent-child relationships
    indent_stack = []  # Stack to manage indentation levels

    # Predefined colors for different levels
    colors = ["lightblue", "lightgreen", "lightyellow", "lightpink", "lightcoral", "lightsalmon"]

    for line in lines:
        stripped_line = line.strip()  # Remove leading/trailing spaces
        if not stripped_line:
            continue

        # Determine the indentation level
        indent_level = count_indentation(line)

        # Handle hierarchy based on indentation
        while indent_stack and indent_level <= indent_stack[-1]:
            node_stack.pop()
            indent_stack.pop()

        # Define the current node
        node_content = stripped_line
        node_name = re.sub(r'[^a-zA-Z0-9_]', '_', node_content)  # Sanitize node name

        # Wrap the node content text to fit within a certain width
        wrapped_content = wrap_text(node_content)

        # Assign a color based on the indentation level of the node
        color = colors[len(indent_stack) % len(colors)]
        current_node = pydot.Node(node_name, label=wrapped_content, style="filled", fillcolor=color)

        # Add the node to the graph if not already present
        if not tree.get_node(node_name):
            tree.add_node(current_node)

        # If there's a parent node, add an edge from the parent to the current node
        if node_stack:
            parent_name = node_stack[-1]
            parent_node = tree.get_node(parent_name)[0]
            tree.add_edge(pydot.Edge(parent_node, current_node, color="black", arrowsize=0.5))

        # Push the current node and indent level onto their respective stacks
        node_stack.append(node_name)
        indent_stack.append(indent_level)

    return tree

def draw_tree(tree):
    # Save the DOT file for debugging
    dot_file_path = 'mind_map.dot'
    tree.write_dot(dot_file_path)  # Save as DOT
    print("DOT file saved as 'mind_map.dot'.")

    # Save and render the tree structure using pydot
    try:
        png_file_path = 'mind_map.png'
        tree.write_png(png_file_path)  # Save as PNG

        # Load the generated PNG image
        #img = Image.open(png_file_path)

        # Optionally add a border to make the image stand out
        #img_with_border = ImageOps.expand(img, border=20, fill="white")
        #img_with_border.show()

        return dot_file_path, png_file_path  # Return file paths for upload

    except Exception as e:
        print(f"Error generating or displaying image: {e}")
        return None, None  # Return None if there was an error


def save_nodes_to_file(nodes, filename="nodes_list.txt"):
    """Save the node names to a text file."""
    try:
        with open(filename, "w") as file:
            for node in nodes:
                file.write(f"{node.get_name()}\n")
        print(f"Node names saved to '{filename}'.")
    except Exception as e:
        print(f"Error saving nodes to file: {e}")

def upload_file_to_firebase(file_path, destination_path):
    """Upload a file to Firebase Storage."""
    bucket = storage.bucket()
    blob = bucket.blob(destination_path)

    try:
        blob.upload_from_filename(file_path)
        download_url = blob.public_url
        print(f'Uploaded {file_path} to Firebase Storage at {destination_path}.')
        return download_url
    except Exception as e:
        print(f"Error uploading file {file_path} to Firebase: {e}")
        return None

def main():
    # Read the text file
    bucket = storage.bucket()
    blob = bucket.blob('process/cleaned_summary.txt')  # Path in Firebase Storage

    try:
        content = blob.download_as_text()  # Download the file content as text
        lines = content.splitlines()  # Split content into lines
    except Exception as e:
        print(f"Error downloading cleaned_output.txt from Firebase: {e}")
        return

    # Build the tree from the text
    tree = build_tree_from_text(lines)

    # Debug: print all nodes to verify
    nodes = tree.get_nodes()
    print("Nodes in the tree:", [node.get_name() for node in nodes])

    # Print the tree structure
    print("Tree Structure:")
    for node in nodes:
        print(node.get_name())

    # Save node names to a text file
    save_nodes_to_file(nodes)

    # Draw the tree
    dot_file_path, png_file_path = draw_tree(tree)

    # Upload the DOT and PNG files to Firebase Storage
    if dot_file_path and png_file_path:
        upload_file_to_firebase(dot_file_path, 'mindmap/mind_map.dot')
        upload_file_to_firebase(png_file_path, 'mindmap/mind_map.png')

if __name__ == "__main__":
    main()