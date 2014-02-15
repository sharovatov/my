%{
#include <stdio.h>
%}

%%
[a-z]    printf("Lowercase word\n");
[A-Z]    printf("Uppercase word\n");
[0-9]    printf("Integer\n");
";"      printf("Semicolon\n");
"("      printf("Open parentheses\n");
")"      printf("Close parentheses\n");
%%