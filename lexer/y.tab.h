addexpr: NUMBER PLUSTOKEN NUMBER
		{
			printf("%d %s %d", $1, $2, $3);
		}
		;