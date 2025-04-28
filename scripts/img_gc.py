import os
import re
import shutil
from datetime import datetime

'''
清理未被文章引用的静态图片
'''


image_pattern = re.compile(r'/image/2025/([a-zA-Z0-9_-]+\.(?:png|jpg|jpeg))')

def find_images_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            return image_pattern.findall(content)
    except Exception as e:
        print(f'Error reading file {file_path}: {e}')
        return []

def traverse_directory(root_folder):
    images = []
    for root, dirs, files in os.walk(root_folder):
        for file_name in files:
            file_path = os.path.join(root, file_name)
            images.extend(find_images_in_file(file_path))
    return images

def find_unreferenced_images(image_folder, referenced_images):
    # 获取图片文件夹中的所有图片文件
    actual_images = {f for f in os.listdir(image_folder) if os.path.isfile(os.path.join(image_folder, f))}
    # 根据实际存在的和被引用的图片文件名集合，找出未被引用的图片
    unreferenced_images = actual_images - set(referenced_images)
    return unreferenced_images

def backup_folder(source_folder):
    backup_folder_name = f"{source_folder}_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    try:
        shutil.copytree(source_folder, backup_folder_name)
        print(f"Backup created at: {backup_folder_name}")
    except Exception as e:
        print(f"Error creating backup: {e}")

def delete_images(image_folder, image_names):
    for name in image_names:
        image_path = os.path.join(image_folder, name)
        if os.path.isfile(image_path):
            os.remove(image_path)
            print(f'Deleted file: {image_path}')
        else:
            print(f'File not found, skipping: {image_path}')

# 根文件夹路径
root_folder = '../content'
# 图片储存路径
image_folder = '../static/image/2025'

# 获取所有图片文件名
all_images = traverse_directory(root_folder)

print('\n' + "Found image files referenced in text files:")
print('\n'.join(all_images))

# 未被引用的图片文件
unreferenced_images = find_unreferenced_images(image_folder, all_images)
print('\n' + "Image files that are in the folder but not referenced in text files:")
print('\n'.join(unreferenced_images))

if len(unreferenced_images) < 1:
    print("No images to clean, Bye.")
    exit()
# 命令行交互部分
user_input = input('\n' + 'Do you want to delete these unreferenced files? (yes/no) ')

if user_input.lower() == 'yes':
    # 在删除之前对图片文件夹做一下备份
    backup_folder(image_folder)
    delete_images(image_folder, unreferenced_images)
    print('All specified unreferenced images have been deleted.')
else:
    print('No files were deleted.')

print('Bye.')
