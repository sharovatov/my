%{
#include <stdio.h>
/* this will be included in the resulting C code */
%}

%% 
begin  printf("Started\n");
hello  printf("Hello yourself!\n");
thanks printf("You are welcome\n");
end    printf("Stopped\n");
%%