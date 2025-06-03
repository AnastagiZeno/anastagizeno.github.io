
def threeSumZero(nums):
    nums.sort()

    ret = []

    for i in range(len(nums)):
        if i > 0 and nums[i] == nums[i -1]:
            continue
        target = 0 - nums[i]
        left = i + 1
        right = len(nums) - 1

        while left < right:
            if nums[left] + nums[right] < target:
                left += 1
            elif nums[left] + nums[right] > target:
                right -= 1
            else:
                ret.append([nums[i], nums[left], nums[right]])
                while left<right and  nums[left] == nums[left+1]:
                    left += 1
                while left < right and nums[right] == nums[right-1]:
                    right -= 1
                left += 1
                right -= 1
    return ret


if __name__ == '__main__':
    print(threeSumZero( [-1,0,1,2,-1,-4]))
