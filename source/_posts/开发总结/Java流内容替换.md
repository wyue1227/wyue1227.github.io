---
title: Java流内容替换
toc: true
date: 2023-06-07 09:50:30
updated: 2023-06-07 09:50:30
tags: [Java, 代码段]
categories: 开发总结
---

业务上有需求，需要将日语外字替换成指定字符，利用FilterInputStream实现。

```Java
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;

public class App {
    public static void main(String[] args) throws Exception {
        String str = "abc";
        InputStream stream = new ByteArrayInputStream(str.getBytes());
        // abc -> acc
        replaceString(stream).stream().forEach( elt -> System.out.println(elt));
	}

    private static List<String> replaceString(InputStream inputStream) throws UnsupportedEncodingException {
        List<String> result = new ArrayList<>();
        FilterInputStream filterInputStream = new FilterInputStream(inputStream) {
            @Override
            public int read(byte[] b, int off, int len) throws IOException {
				int bytesRead = super.read(b, off, len);
				if (bytesRead != -1) {
					for (int i = off; i < off + bytesRead - 1; i++) {
                        // ab -> ac
						if (b[i] == (byte) 0x61 && b[i + 1] == (byte) 0x62) {
							b[i] = (byte) 0x61;
							b[i + 1] = (byte) 0x63;
						}
					}
				}
				return bytesRead;
			}
        };

        BufferedReader br = new BufferedReader(new InputStreamReader(filterInputStream, "UTF8"));
        br.lines().forEach( elt -> {
            result.add(elt);
        });
        return result;
    }
}
```