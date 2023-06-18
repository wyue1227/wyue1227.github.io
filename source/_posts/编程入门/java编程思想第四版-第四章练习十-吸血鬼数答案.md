---
title: java编程思想第四版_第四章练习十_吸血鬼数答案
toc: true
date: 2020-03-22 14:42:06
tags: Java
categories: 编程入门
excerpt: Java入门题解
---

## 题目

![](/images/java编程思想第四版-第四章练习十-吸血鬼数答案/2022-12-05-15-01-44.png)

## 说明

网上找了找各种答案，感觉怪怪的。大多用了各种字符串转换，自带的sort排序之类的。

初入编程做这个题目的新人应该还不懂这些，刚刚学完基本的+-*/%，所以写了这篇希望能帮助到新人。

```Java
package example;

/*
 * 输出结果：
 * 1395=15*93
 * 1260=21*60
 * 1827=21*87
 * 2187=27*81
 * 1530=30*51
 * 1435=35*41
 * 6880=80*86
*/
public class Example4_10 {

    public static void main(String[] args) {

        int[] array1 = new int[4];
        int[] array2 = new int[4];

        for (int i = 10; i < 100; i++) {
            for (int j = i + 1; j < 100; j++) {
                int resultNum = i * j;
                if (resultNum < 1000) {
                    continue;
                }
                // 取i的十位和个位
                array1[0] = i/10;
                array1[1] = i%10;

                // 取j的十位和个位
                array1[2] = j/10;
                array1[3] = j%10;

                // 取乘积的千位、百位、十位和个位
                array2[0] = resultNum/1000;
                array2[1] = resultNum/100%10;
                array2[2] = resultNum/10%10;
                array2[3] = resultNum%10;

                if (checkZero(array2[2], array2[3]) && 
                	sortAndCompareDif(array1) && 
                	sortAndCompareDif(array2) &&
                	arraysEquals(array1, array2)) {
                	    System.out.println(resultNum + "=" + i + "*" + j);
                }
            }
        }
    }
    
    /**
     * 判断乘积最后两位是否为零
     * @param num1 乘积第三位
     * @param num2 乘积第四位
     * @return 都为零返回false，否则返回true
     */
    private static boolean checkZero(int num1, int num2) {
    	return num1 == 0 && num2 == 0 ? false : true;
    }

    /**
     * 排序的同时，判断是否有出现次数大于三的数
     * @param nums 数组传值
     * @return 判断每个值唯一的结果
     */
    private static boolean sortAndCompareDif(int[] nums) {
    	
        for (int i = 0; i < nums.length - 1; i++) {
        	int count = 0;
            int tmp =i;
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[j] < nums[tmp] ) {
                    tmp = j;
                } else if (i < 2 && nums[j] == nums[i]) {
                	count += 1;
                }
            }
            if (count < 2) {
            	int tmpNum = nums[tmp];
                nums[tmp] = nums[i];
                nums[i] = tmpNum;
            } else {
            	return false;
            }
        }
        return true;
    }

    /**
     * 比较两个数组是否相同
     * @param nums1 数组1
     * @param nums2 数组2
     * @return 返回比对结果
     */
    private static boolean arraysEquals(int[] nums1, int[] nums2) {
        if (nums1.length != nums2.length) {
            return false;
        }
        for (int index = 0; index < nums1.length; index ++) {
            if (nums1[index] != nums2[index]) {
                return false;
            }
        }
        return true;
    }
}
```