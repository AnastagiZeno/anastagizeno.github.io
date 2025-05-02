import os
import re
import shutil
from datetime import datetime

'''
清理未被文章引用的静态图片（支持任意层级、按路径匹配）
'''

# 匹配形如 /image/xxx/yyy.jpg 的图片路径（捕获完整路径）
image_pattern = re.compile(r'(/image/[a-zA-Z0-9_\-/]+?\.(?:png|jpg|jpeg))')

# 提取文章中引用的所有图片路径
def find_images_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            return image_pattern.findall(content)
    except Exception as e:
        print(f'Error reading file {file_path}: {e}')
        return []

# 遍历文章目录，提取所有引用图片路径
def traverse_directory(root_folder):
    images = []
    for root, dirs, files in os.walk(root_folder):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for file_name in files:
            if not file_name.startswith('.'):
                file_path = os.path.join(root, file_name)
                images.extend(find_images_in_file(file_path))
    return set(images)

# 获取所有实际存在的图片路径（转换为以 `/image/...` 开头）
def find_all_images_with_relative_path(image_root, static_root='../static'):
    image_extensions = {'.png', '.jpg', '.jpeg'}
    image_paths = set()
    for root, dirs, files in os.walk(image_root):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for file in files:
            if not file.startswith('.') and os.path.splitext(file)[1].lower() in image_extensions:
                abs_path = os.path.join(root, file)
                # 生成以 `/image/...` 开头的相对路径
                rel_path = os.path.relpath(abs_path, static_root).replace('\\', '/')
                image_paths.add('/' + rel_path)
    return image_paths

# 删除未被引用的图片文件
def delete_images_by_relative_path(static_root, all_image_paths):
    for rel_path in all_image_paths:
        abs_path = os.path.join(static_root, rel_path.lstrip('/'))
        if os.path.isfile(abs_path):
            try:
                os.remove(abs_path)
                print(f'Deleted file: {abs_path}')
            except Exception as e:
                print(f'Failed to delete {abs_path}: {e}')

# 备份整个图片目录
def backup_folder(folder_path):
    backup_path = f"{folder_path}_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    try:
        shutil.copytree(folder_path, backup_path)
        print(f"Backup created at: {backup_path}")
    except Exception as e:
        print(f"Error creating backup: {e}")

# --- 主流程 ---
if __name__ == '__main__':
    root_folder = '../content'
    static_root = '../static'
    image_root = os.path.join(static_root, 'image')

    # 引用图片路径（以 /image/... 格式保存）
    referenced_images = traverse_directory(root_folder)
    print('\nReferenced image paths:')
    print('\n'.join(sorted(referenced_images)))

    # 实际存在的图片路径（以 /image/... 格式保存）
    all_actual_images = find_all_images_with_relative_path(image_root, static_root)

    # 找出未被引用的图片路径
    unreferenced_images = all_actual_images - referenced_images
    print('\nUnreferenced image paths:')
    print('\n'.join(sorted(unreferenced_images)))

    if not unreferenced_images:
        print("No images to clean. Bye.")
        exit()

    user_input = input('\nDo you want to delete these unreferenced files? (yes/no) ')
    if user_input.lower() == 'yes':
        backup_folder(image_root)
        delete_images_by_relative_path(static_root, unreferenced_images)
        print('All specified unreferenced images have been deleted.')
    else:
        print('No files were deleted.')

    print('Bye.')
