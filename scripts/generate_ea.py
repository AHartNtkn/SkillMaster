import json, os

skills = [
{"id": "EA:AS001", "title": "Identify numerals 0-9", "desc": "Recognize and name the written symbols for numbers zero through nine."},
{"id": "EA:AS002", "title": "Write numerals 0-9", "desc": "Correctly form the written symbols for numbers zero through nine."},
{"id": "EA:AS003", "title": "Understand one-to-one correspondence when counting", "desc": "Match each object in a set with a single number word or numeral when counting."},
{"id": "EA:AS004", "title": "Count objects up to 10", "desc": "Accurately determine the quantity of items in a set containing up to 10 objects."},
{"id": "EA:AS005", "title": "Compare quantities (more/less/equal) up to 10", "desc": "Determine if one group of up to 10 objects has more, less, or an equal number of items as another group."},
{"id": "EA:AS006", "title": "Count forwards to 20", "desc": "Recite number sequence from 1 to 20."},
{"id": "EA:AS007", "title": "Count backwards from 10", "desc": "Recite number sequence from 10 down to 0 or 1."},
{"id": "EA:AS008", "title": "Identify ordinal numbers (e.g., first, second, third) up to 5th", "desc": "Understand and use terms describing position in a sequence up to fifth."},
{"id": "EA:AS009", "title": "Sequence numbers up to 20", "desc": "Arrange numbers in correct order from smallest to largest, or vice-versa, up to 20."},
{"id": "EA:AS010", "title": "Understand addition as combining sets", "desc": "Grasp the concept that addition means putting together groups of items to find a total."},
{"id": "EA:AS011", "title": "Add two single-digit numbers with sums up to 10", "desc": "Calculate the sum of two numbers, each between 0 and 9, where the total is 10 or less."},
{"id": "EA:AS012", "title": "Add two single-digit numbers with sums up to 20", "desc": "Calculate the sum of two numbers, each between 0 and 9, where the total is 20 or less."},
{"id": "EA:AS013", "title": "Understand and use the plus (+) and equals (=) signs", "desc": "Recognize and correctly interpret the symbols for addition and equality."},
{"id": "EA:AS014", "title": "Solve single-step addition word problems (sums to 20)", "desc": "Interpret and solve story problems requiring addition of numbers with sums up to 20."},
{"id": "EA:AS015", "title": "Understand the commutative property of addition", "desc": "Recognize that changing the order of addends does not change the sum (e.g., 2+3 = 3+2)."},
{"id": "EA:AS016", "title": "Add zero to a number", "desc": "Understand that adding zero to any number results in that same number."},
{"id": "EA:AS017", "title": "Find a missing addend in sums up to 10", "desc": "Determine the unknown number in an addition equation where the sum is 10 or less (e.g., 3 + ? = 7)."},
{"id": "EA:AS018", "title": "Understand subtraction as taking away or finding the difference", "desc": "Grasp the concept that subtraction means removing items from a group or comparing two groups."},
{"id": "EA:AS019", "title": "Subtract single-digit numbers from numbers up to 10", "desc": "Calculate the difference when subtracting a single-digit number from a number 10 or less."},
{"id": "EA:AS020", "title": "Subtract single-digit numbers from numbers up to 20", "desc": "Calculate the difference when subtracting a single-digit number from a number 20 or less."},
{"id": "EA:AS021", "title": "Understand and use the minus (-) sign", "desc": "Recognize and correctly interpret the symbol for subtraction."},
{"id": "EA:AS022", "title": "Solve single-step subtraction word problems (within 20)", "desc": "Interpret and solve story problems requiring subtraction of numbers within 20."},
{"id": "EA:AS023", "title": "Relate subtraction to addition as inverse operations (within 20)", "desc": "Understand that subtraction can 'undo' addition and use addition facts to solve subtraction problems."},
{"id": "EA:AS024", "title": "Subtract zero from a number", "desc": "Understand that subtracting zero from any number results in that same number."},
{"id": "EA:AS025", "title": "Subtract a number from itself", "desc": "Understand that subtracting a number from itself results in zero."},
{"id": "EA:AS026", "title": "Identify tens and ones in a two-digit number", "desc": "Recognize the place value of each digit in a number from 10 to 99."},
{"id": "EA:AS027", "title": "Represent two-digit numbers using base-ten blocks (or drawings)", "desc": "Model two-digit numbers using physical or visual representations of tens and ones."},
{"id": "EA:AS028", "title": "Compare two-digit numbers using <, >, =", "desc": "Determine if one two-digit number is less than, greater than, or equal to another."},
{"id": "EA:AS029", "title": "Understand that the two digits of a two-digit number represent amounts of tens and ones", "desc": "Grasp the meaning of each digit's position in a two-digit number."},
{"id": "EA:AS030", "title": "Identify hundreds, tens, and ones in a three-digit number", "desc": "Recognize the place value of each digit in a number from 100 to 999."},
{"id": "EA:AS031", "title": "Represent three-digit numbers using base-ten blocks (or drawings)", "desc": "Model three-digit numbers using physical or visual representations of hundreds, tens, and ones."},
{"id": "EA:AS032", "title": "Compare three-digit numbers using <, >, =", "desc": "Determine if one three-digit number is less than, greater than, or equal to another."},
{"id": "EA:AS033", "title": "Add a two-digit number and a one-digit number without regrouping", "desc": "Sum a two-digit number and a single-digit number where no carrying is required."},
{"id": "EA:AS034", "title": "Add two two-digit numbers without regrouping", "desc": "Sum two two-digit numbers where no carrying is required in any place value column."},
{"id": "EA:AS035", "title": "Add a two-digit number and a one-digit number with regrouping (carrying)", "desc": "Sum a two-digit number and a single-digit number where carrying from ones to tens is required."},
{"id": "EA:AS036", "title": "Add two two-digit numbers with regrouping (carrying)", "desc": "Sum two two-digit numbers where carrying from ones to tens (or tens to hundreds) is required."},
{"id": "EA:AS037", "title": "Add three or more two-digit numbers", "desc": "Sum a list of three or more two-digit numbers, potentially involving regrouping."},
{"id": "EA:AS038", "title": "Add three-digit numbers with and without regrouping", "desc": "Sum two or more three-digit numbers, correctly applying regrouping rules."},
{"id": "EA:AS039", "title": "Solve multi-step addition word problems involving multi-digit numbers", "desc": "Interpret and solve story problems requiring multiple addition operations with multi-digit numbers."},
{"id": "EA:AS040", "title": "Subtract a one-digit number from a two-digit number without regrouping", "desc": "Find the difference between a two-digit number and a single-digit number where no borrowing is required."},
{"id": "EA:AS041", "title": "Subtract two two-digit numbers without regrouping", "desc": "Find the difference between two two-digit numbers where no borrowing is required in any place value column."},
{"id": "EA:AS042", "title": "Subtract a one-digit number from a two-digit number with regrouping (borrowing)", "desc": "Find the difference between a two-digit number and a single-digit number where borrowing from tens to ones is required."},
{"id": "EA:AS043", "title": "Subtract two two-digit numbers with regrouping (borrowing)", "desc": "Find the difference between two two-digit numbers where borrowing is required."},
{"id": "EA:AS044", "title": "Subtract three-digit numbers with and without regrouping", "desc": "Find the difference between two three-digit numbers, correctly applying regrouping rules."},
{"id": "EA:AS045", "title": "Subtract across zeros", "desc": "Perform subtraction when borrowing is required from a place value column containing a zero (e.g., 200 - 37)."},
{"id": "EA:AS046", "title": "Solve multi-step subtraction word problems involving multi-digit numbers", "desc": "Interpret and solve story problems requiring multiple subtraction operations with multi-digit numbers."},
{"id": "EA:AS047", "title": "Understand multiplication as repeated addition", "desc": "Grasp the concept that multiplying is a shortcut for adding the same number multiple times."},
{"id": "EA:AS048", "title": "Represent multiplication using arrays or equal groups", "desc": "Model multiplication problems by arranging objects in rows and columns or as sets of equal size."},
{"id": "EA:AS049", "title": "Understand and use the multiplication (x) sign", "desc": "Recognize and correctly interpret the symbol for multiplication."},
{"id": "EA:AS050", "title": "Memorize/recall multiplication facts up to 10x10", "desc": "Fluently recall products of two single-digit numbers from 0x0 to 10x10."},
{"id": "EA:AS051", "title": "Understand the commutative property of multiplication", "desc": "Recognize that changing the order of factors does not change the product (e.g., 2x3 = 3x2)."},
{"id": "EA:AS052", "title": "Multiply by 0 and 1", "desc": "Understand that multiplying any number by 0 results in 0, and by 1 results in the number itself."},
{"id": "EA:AS053", "title": "Solve single-step multiplication word problems", "desc": "Interpret and solve story problems requiring a single multiplication operation."},
{"id": "EA:AS054", "title": "Multiply a single-digit number by a multiple of 10", "desc": "Calculate products like 3 x 40 or 7 x 20."},
{"id": "EA:AS055", "title": "Understand division as equal sharing (partitive)", "desc": "Grasp the concept of dividing a quantity into a known number of equal groups."},
{"id": "EA:AS056", "title": "Understand division as repeated subtraction (measurement/quotitive)", "desc": "Grasp the concept of finding how many times a smaller number fits into a larger number by subtracting."},
{"id": "EA:AS057", "title": "Understand and use the division (÷) sign", "desc": "Recognize and correctly interpret the symbol for division."},
{"id": "EA:AS058", "title": "Relate division to multiplication as inverse operations", "desc": "Understand that division can 'undo' multiplication and use multiplication facts to solve division problems."},
{"id": "EA:AS059", "title": "Perform division with single-digit divisors and dividends (whole number quotients, no remainders)", "desc": "Calculate quotients for division problems where the answer is a whole number and there is no remainder."},
{"id": "EA:AS060", "title": "Understand division by 1", "desc": "Recognize that dividing any number by 1 results in the number itself."},
{"id": "EA:AS061", "title": "Understand that division by zero is undefined", "desc": "Grasp the concept that a number cannot be divided by zero."},
{"id": "EA:AS062", "title": "Solve single-step division word problems (no remainders)", "desc": "Interpret and solve story problems requiring a single division operation resulting in a whole number."},
{"id": "EA:AS063", "title": "Identify and represent unit fractions (1/2, 1/3, 1/4) of a whole", "desc": "Recognize and show fractions where the numerator is 1, representing one part of an equally divided whole."},
{"id": "EA:AS064", "title": "Identify and represent non-unit fractions (e.g., 2/3, 3/4) of a whole", "desc": "Recognize and show fractions where the numerator is greater than 1, representing multiple parts of an equally divided whole."},
{"id": "EA:AS065", "title": "Understand the meaning of numerator and denominator", "desc": "Identify the top number (numerator) as parts considered and bottom number (denominator) as total equal parts."},
{"id": "EA:AS066", "title": "Compare unit fractions with visual aids", "desc": "Determine which of two unit fractions is larger or smaller using models or diagrams."},
{"id": "EA:AS067", "title": "Recognize simple equivalent fractions (e.g., 1/2 = 2/4) using models", "desc": "Identify fractions that represent the same amount using visual representations."},
{"id": "EA:AS068", "title": "Represent fractions on a number line (simple cases)", "desc": "Locate and plot simple fractions like 1/2, 1/4, 3/4 on a number line between 0 and 1."},
{"id": "EA:AS069", "title": "Compare lengths of objects directly (longer, shorter, taller)", "desc": "Determine relative lengths by direct visual comparison."},
{"id": "EA:AS070", "title": "Measure length using non-standard units (e.g., paperclips, blocks)", "desc": "Use everyday objects to quantify the length of another object."},
{"id": "EA:AS071", "title": "Estimate and measure length using standard units (e.g., cm, inches)", "desc": "Approximate and then accurately measure length using centimeters or inches."},
{"id": "EA:AS072", "title": "Compare weights of objects directly (heavier, lighter)", "desc": "Determine relative weights by direct comparison, e.g., holding them or using a simple balance."},
{"id": "EA:AS073", "title": "Tell and write time to the hour using analog and digital clocks", "desc": "Read and record time when the minute hand is on the 12."},
{"id": "EA:AS074", "title": "Tell and write time to the half-hour using analog and digital clocks", "desc": "Read and record time when the minute hand is on the 6."},
{"id": "EA:AS075", "title": "Identify common coins (penny, nickel, dime, quarter) and their values", "desc": "Recognize US coins and state their respective cent values."},
{"id": "EA:AS076", "title": "Count combinations of pennies, nickels, and dimes", "desc": "Calculate the total value of a collection of pennies, nickels, and dimes."},
{"id": "EA:AS077", "title": "Round whole numbers to the nearest 10", "desc": "Determine the multiple of 10 closest to a given whole number."},
{"id": "EA:AS078", "title": "Round whole numbers to the nearest 100", "desc": "Determine the multiple of 100 closest to a given whole number."},
{"id": "EA:AS079", "title": "Round whole numbers to the nearest 1000", "desc": "Determine the multiple of 1000 closest to a given whole number."},
{"id": "EA:AS080", "title": "Estimate sums of two-digit numbers by rounding", "desc": "Approximate the sum of two 2-digit numbers by rounding each to the nearest 10 before adding."},
{"id": "EA:AS081", "title": "Estimate sums of three-digit numbers by rounding", "desc": "Approximate the sum of two 3-digit numbers by rounding each to the nearest 100 before adding."},
{"id": "EA:AS082", "title": "Estimate differences of two-digit numbers by rounding", "desc": "Approximate the difference of two 2-digit numbers by rounding each to the nearest 10 before subtracting."},
{"id": "EA:AS083", "title": "Estimate differences of three-digit numbers by rounding", "desc": "Approximate the difference of two 3-digit numbers by rounding each to the nearest 100 before subtracting."},
{"id": "EA:AS084", "title": "Use estimation to check reasonableness of answers (add/sub)", "desc": "Compare an estimated sum/difference to a calculated one to verify if the calculation is plausible."},
{"id": "EA:AS085", "title": "Estimate products by rounding factors", "desc": "Approximate the product of two numbers by rounding one or both factors before multiplying."},
{"id": "EA:AS086", "title": "Estimate quotients by using compatible numbers", "desc": "Approximate a quotient by finding numbers close to the dividend/divisor that divide easily."},
{"id": "EA:AS087", "title": "Identify and apply the associative property of addition", "desc": "Recognize and use (a+b)+c = a+(b+c) to simplify addition."},
{"id": "EA:AS088", "title": "Identify and apply the associative property of multiplication", "desc": "Recognize and use (axb)xc = ax(bxc) to simplify multiplication."},
{"id": "EA:AS089", "title": "Identify and apply the distributive property of multiplication over addition", "desc": "Recognize and use ax(b+c) = (axb)+(axc)."},
{"id": "EA:AS090", "title": "Understand the identity property of multiplication (a x 1 = a)", "desc": "Recognize that any number multiplied by 1 remains unchanged; identify 1 as multiplicative identity."},
{"id": "EA:AS091", "title": "Understand the identity property of addition (a + 0 = a)", "desc": "Recognize that any number added to 0 remains unchanged; identify 0 as additive identity."},
{"id": "EA:AS092", "title": "Identify factors of a whole number", "desc": "List all whole numbers that can be multiplied to get a given number (e.g., factors of 12)."},
{"id": "EA:AS093", "title": "Identify multiples of a single-digit number", "desc": "List numbers obtained by multiplying a single-digit number by consecutive whole numbers (e.g., multiples of 3)."},
{"id": "EA:AS094", "title": "Determine if a whole number is a multiple of another single-digit number", "desc": "Check if a whole number can be evenly divided by a single-digit number."},
{"id": "EA:AS095", "title": "Identify common factors of two whole numbers", "desc": "List factors shared by two different whole numbers."},
{"id": "EA:AS096", "title": "Identify common multiples of two whole numbers", "desc": "List multiples shared by two different whole numbers."},
{"id": "EA:AS097", "title": "Understand prime and composite numbers (basic introduction)", "desc": "Distinguish numbers with exactly two factors (prime) from those with more (composite)."},
{"id": "EA:AS098", "title": "Multiply a two-digit number by a one-digit number (with regrouping)", "desc": "Calculate product of a 2-digit and 1-digit number, involving carrying (e.g., 24 x 3)."},
{"id": "EA:AS099", "title": "Multiply a three-digit number by a one-digit number (with regrouping)", "desc": "Calculate product of a 3-digit and 1-digit number, involving carrying (e.g., 124 x 3)."},
{"id": "EA:AS100", "title": "Multiply two two-digit numbers", "desc": "Calculate product of two 2-digit numbers (e.g., 24 x 13)."},
{"id": "EA:AS101", "title": "Solve multi-step word problems involving multi-digit multiplication", "desc": "Interpret and solve story problems requiring multiple multiplication steps with multi-digit numbers."},
{"id": "EA:AS102", "title": "Perform division with single-digit divisors resulting in a remainder", "desc": "Divide a number by a single-digit number where the division is not exact, identifying the remainder."},
{"id": "EA:AS103", "title": "Interpret the meaning of a remainder in a division word problem", "desc": "Understand what the leftover amount represents in the context of a story problem."},
{"id": "EA:AS104", "title": "Divide a two-digit number by a one-digit number (long division steps, no remainder)", "desc": "Use the long division algorithm for 2-digit dividends and 1-digit divisors, resulting in no remainder."},
{"id": "EA:AS105", "title": "Divide a two-digit number by a one-digit number (long division steps, with remainder)", "desc": "Use the long division algorithm for 2-digit dividends and 1-digit divisors, resulting in a remainder."},
{"id": "EA:AS106", "title": "Divide a three-digit number by a one-digit number (long division steps, with/without remainder)", "desc": "Use long division for 3-digit dividends and 1-digit divisors."},
{"id": "EA:AS107", "title": "Solve multi-step word problems involving division with remainders", "desc": "Interpret and solve story problems requiring division where remainders must be considered."},
{"id": "EA:AS108", "title": "Compare fractions with like numerators", "desc": "Determine which fraction is larger/smaller when numerators are same but denominators differ (e.g., 2/5 vs 2/3)."},
{"id": "EA:AS109", "title": "Compare fractions with like denominators", "desc": "Determine which fraction is larger/smaller when denominators are same but numerators differ (e.g., 2/5 vs 3/5)."},
{"id": "EA:AS110", "title": "Compare fractions to benchmarks (1/2, 1)", "desc": "Determine if a fraction is less than, greater than, or equal to 1/2 or 1."},
{"id": "EA:AS111", "title": "Find common denominators for two simple fractions", "desc": "Identify a common multiple for the denominators of two fractions (e.g., for 1/2 and 1/3, use 6)."},
{"id": "EA:AS112", "title": "Compare fractions with unlike denominators by finding a common denominator", "desc": "Rewrite fractions with a common denominator to compare them."},
{"id": "EA:AS113", "title": "Order a set of simple fractions", "desc": "Arrange three or more fractions (like/unlike denominators) from least to greatest or vice-versa."},
{"id": "EA:AS114", "title": "Generate equivalent fractions by multiplying numerator and denominator by the same number", "desc": "Create an equal fraction by scaling up (e.g., 1/2 = 2/4 = 3/6)."},
{"id": "EA:AS115", "title": "Generate equivalent fractions by dividing numerator and denominator by a common factor", "desc": "Create an equal fraction by scaling down (e.g., 6/9 = 2/3)."},
{"id": "EA:AS116", "title": "Simplify fractions to their lowest terms", "desc": "Reduce a fraction by dividing numerator and denominator by their greatest common factor."},
{"id": "EA:AS117", "title": "Identify improper fractions", "desc": "Recognize fractions where the numerator is greater than or equal to the denominator."},
{"id": "EA:AS118", "title": "Identify mixed numbers", "desc": "Recognize numbers composed of a whole number and a proper fraction."},
{"id": "EA:AS119", "title": "Convert improper fractions to mixed numbers", "desc": "Change an improper fraction into an equivalent whole number and proper fraction (e.g., 7/3 to 2 1/3)."},
{"id": "EA:AS120", "title": "Convert mixed numbers to improper fractions", "desc": "Change a mixed number into an equivalent fraction where numerator is larger than denominator (e.g., 2 1/3 to 7/3)."},
{"id": "EA:AS121", "title": "Represent improper fractions and mixed numbers on a number line", "desc": "Locate and plot improper fractions and mixed numbers on a number line beyond 1."},
{"id": "EA:AS122", "title": "Add fractions with like denominators", "desc": "Sum two or more fractions that share the same denominator."},
{"id": "EA:AS123", "title": "Subtract fractions with like denominators", "desc": "Find the difference between two fractions that share the same denominator."},
{"id": "EA:AS124", "title": "Add fractions with unlike denominators (simple cases)", "desc": "Sum two fractions with different denominators by first finding a common denominator (e.g., halves and fourths)."},
{"id": "EA:AS125", "title": "Subtract fractions with unlike denominators (simple cases)", "desc": "Subtract two fractions with different denominators by first finding a common denominator."},
{"id": "EA:AS126", "title": "Add mixed numbers with like denominators (no regrouping)", "desc": "Sum two mixed numbers where fraction parts have same denominator and sum of fractions is less than 1."},
{"id": "EA:AS127", "title": "Subtract mixed numbers with like denominators (no regrouping)", "desc": "Subtract mixed numbers where fraction parts have same denominator and minuend fraction is larger."},
{"id": "EA:AS128", "title": "Solve word problems involving addition/subtraction of fractions with like denominators", "desc": "Interpret and solve story problems requiring addition or subtraction of like-denominator fractions."},
{"id": "EA:AS129", "title": "Understand multiplication of a fraction by a whole number as repeated addition", "desc": "Grasp 3 x 1/4 as 1/4 + 1/4 + 1/4."},
{"id": "EA:AS130", "title": "Multiply a unit fraction by a whole number", "desc": "Calculate the product of a whole number and a fraction with numerator 1 (e.g., 5 x 1/3)."},
{"id": "EA:AS131", "title": "Multiply a non-unit fraction by a whole number", "desc": "Calculate the product of a whole number and a fraction with numerator >1 (e.g., 4 x 2/3)."},
{"id": "EA:AS132", "title": "Solve word problems involving multiplication of a fraction by a whole number", "desc": "Interpret and solve story problems requiring multiplication of a fraction by a whole number."},
{"id": "EA:AS133", "title": "Understand tenths as fractions with a denominator of 10", "desc": "Recognize that one tenth is 1 part out of 10 equal parts of a whole (1/10)."},
{"id": "EA:AS134", "title": "Understand hundredths as fractions with a denominator of 100", "desc": "Recognize that one hundredth is 1 part out of 100 equal parts of a whole (1/100)."},
{"id": "EA:AS135", "title": "Read and write decimals to the tenths place", "desc": "Correctly say and write numbers like 0.7 or 2.3."},
{"id": "EA:AS136", "title": "Read and write decimals to the hundredths place", "desc": "Correctly say and write numbers like 0.07 or 2.35."},
{"id": "EA:AS137", "title": "Relate tenths to decimal notation (e.g., 3/10 = 0.3)", "desc": "Convert fractions with denominator 10 to their decimal equivalents and vice-versa."},
{"id": "EA:AS138", "title": "Relate hundredths to decimal notation (e.g., 27/100 = 0.27)", "desc": "Convert fractions with denominator 100 to their decimal equivalents and vice-versa."},
{"id": "EA:AS139", "title": "Identify the place value of digits in decimals to the hundredths place", "desc": "Recognize the value of digits in the tenths and hundredths positions."},
{"id": "EA:AS140", "title": "Represent decimals using models (e.g., base-ten blocks, grids)", "desc": "Visually show decimal quantities using area models or base-ten representations."},
{"id": "EA:AS141", "title": "Compare decimals to the tenths place", "desc": "Determine if one decimal (e.g., 0.4) is <, >, or = to another decimal (e.g., 0.6) in tenths."},
{"id": "EA:AS142", "title": "Compare decimals to the hundredths place", "desc": "Determine if one decimal (e.g., 0.45) is <, >, or = to another decimal (e.g., 0.42) in hundredths."},
{"id": "EA:AS143", "title": "Order a set of decimals (tenths and hundredths)", "desc": "Arrange three or more decimals from least to greatest or vice-versa."},
{"id": "EA:AS144", "title": "Relate decimals to money (e.g., $0.50 is 50 hundredths)", "desc": "Understand and represent monetary values using decimal notation."},
{"id": "EA:AS145", "title": "Add decimals to the tenths place (no regrouping)", "desc": "Sum two decimals written to tenths where no carrying is required (e.g., 0.2 + 0.5)."},
{"id": "EA:AS146", "title": "Add decimals to the hundredths place (no regrouping, often related to money)", "desc": "Sum two decimals to hundredths where no carrying is required (e.g., $0.25 + $0.50)."},
{"id": "EA:AS147", "title": "Subtract decimals to the tenths place (no regrouping)", "desc": "Subtract two decimals to tenths where no borrowing is required (e.g., 0.7 - 0.3)."},
{"id": "EA:AS148", "title": "Subtract decimals to the hundredths place (no regrouping, often related to money)", "desc": "Subtract two decimals to hundredths where no borrowing is required (e.g., $0.75 - $0.20)."},
{"id": "EA:AS149", "title": "Tell and write time to the nearest five minutes", "desc": "Read and record time on analog/digital clocks when minute hand points to numbers on clock face."},
{"id": "EA:AS150", "title": "Tell and write time to the nearest minute", "desc": "Read and record time on analog/digital clocks with precision to the exact minute."},
{"id": "EA:AS151", "title": "Understand and use AM and PM", "desc": "Distinguish between times in the morning/afternoon/evening using AM (ante meridiem) and PM (post meridiem)."},
{"id": "EA:AS152", "title": "Calculate elapsed time in hours", "desc": "Determine the duration between two times when measured in full hours (e.g., 2:00 to 5:00 is 3 hours)."},
{"id": "EA:AS153", "title": "Calculate elapsed time in minutes (within the hour)", "desc": "Determine the duration between two times, in minutes, when both times are within the same hour."},
{"id": "EA:AS154", "title": "Know units of time (seconds, minutes, hours, days, weeks, months, years)", "desc": "Recognize and name standard units for measuring time and their general relationships."},
{"id": "EA:AS155", "title": "Convert between units of time (simple conversions)", "desc": "Change from one unit of time to another (e.g., 120 minutes to 2 hours, 3 days to weeks)."},
{"id": "EA:AS156", "title": "Count collections of coins including quarters", "desc": "Calculate the total value of a collection of pennies, nickels, dimes, and quarters."},
{"id": "EA:AS157", "title": "Make change from $1.00", "desc": "Determine the correct amount of coins to return as change from one dollar for a purchase less than $1.00."},
{"id": "EA:AS158", "title": "Solve word problems involving adding and subtracting money amounts (with decimals)", "desc": "Interpret and solve story problems requiring addition or subtraction of money values written in decimal form."},
{"id": "EA:AS159", "title": "Represent money amounts using dollar and cent notation", "desc": "Write monetary values correctly using $ symbol and decimal point (e.g., $5.25)."},
{"id": "EA:AS160", "title": "Compare capacities directly (holds more, holds less)", "desc": "Determine which of two containers can hold more or less liquid by visual inspection or direct comparison."},
{"id": "EA:AS161", "title": "Measure capacity using non-standard units (e.g., cups, scoops)", "desc": "Use everyday objects to quantify how much a container can hold."},
{"id": "EA:AS162", "title": "Identify standard units of liquid volume (e.g., liter, cup, gallon - recognition)", "desc": "Recognize common units used for measuring liquid volume."},
{"id": "EA:AS163", "title": "Estimate liquid volumes", "desc": "Approximate the amount a container holds using standard units without precise measurement."},
{"id": "EA:AS164", "title": "Measure weight/mass using non-standard units", "desc": "Use everyday objects (e.g., blocks) to compare or quantify the weight of other objects."},
{"id": "EA:AS165", "title": "Identify standard units of weight/mass (e.g., gram, pound - recognition)", "desc": "Recognize common units used for measuring weight or mass."},
{"id": "EA:AS166", "title": "Estimate weights/masses", "desc": "Approximate the weight/mass of an object using standard units without precise measurement."},
{"id": "EA:AS167", "title": "Understand temperature as a measure of hotness or coldness", "desc": "Grasp the basic concept of what temperature indicates."},
{"id": "EA:AS168", "title": "Read a thermometer (Celsius and Fahrenheit, basic increments)", "desc": "Determine the temperature shown on a thermometer scale in degrees Celsius or Fahrenheit."},
{"id": "EA:AS169", "title": "Understand perimeter as the distance around a shape", "desc": "Grasp the concept that perimeter is the total length of the boundary of a 2D figure."},
{"id": "EA:AS170", "title": "Find the perimeter of a polygon by adding side lengths", "desc": "Calculate the perimeter of a shape with straight sides by summing the lengths of all its sides."},
{"id": "EA:AS171", "title": "Understand area as the measure of surface covered by a shape", "desc": "Grasp the concept that area quantifies the 2D space a flat shape occupies."},
{"id": "EA:AS172", "title": "Find the area of a rectangle by counting unit squares", "desc": "Determine the area of a rectangular region by counting the number of same-sized squares that cover it."},
{"id": "EA:AS173", "title": "Find the area of a rectangle by multiplying side lengths (whole numbers)", "desc": "Calculate area of a rectangle using the formula length × width, with whole number dimensions."},
{"id": "EA:AS174", "title": "Identify common 2D shapes", "desc": "Recognize and name shapes like circle, square, rectangle, triangle, hexagon, pentagon, rhombus, trapezoid."},
{"id": "EA:AS175", "title": "Describe attributes of 2D shapes (number of sides, number of vertices/corners)", "desc": "Identify and state key properties of 2D shapes, such as how many sides or corners they have."},
{"id": "EA:AS176", "title": "Sort 2D shapes based on attributes", "desc": "Group 2D shapes according to shared properties like number of sides or presence of right angles."},
{"id": "EA:AS177", "title": "Identify lines, line segments, rays, and angles (right, acute, obtuse - basic recognition)", "desc": "Recognize basic geometric elements and types of angles by sight."},
{"id": "EA:AS178", "title": "Identify parallel and perpendicular lines (basic recognition)", "desc": "Distinguish between lines that never meet (parallel) and lines that meet at a right angle (perpendicular)."},
{"id": "EA:AS179", "title": "Identify common 3D shapes", "desc": "Recognize and name shapes like cube, sphere, cone, cylinder, rectangular prism, pyramid."},
{"id": "EA:AS180", "title": "Describe attributes of 3D shapes (number of faces, edges, vertices - for simple shapes like cubes)", "desc": "Identify and state key properties of 3D shapes, such as flat surfaces, straight edges, and points."},
{"id": "EA:AS181", "title": "Relate 2D shapes to faces of 3D shapes", "desc": "Recognize the 2D shapes that form the flat surfaces (faces) of 3D objects."},
{"id": "EA:AS182", "title": "Collect data using surveys or observations", "desc": "Gather information by asking questions or by watching and recording events."},
{"id": "EA:AS183", "title": "Organize data using tally marks", "desc": "Use tally marks as a simple method to count and record frequencies of data points."},
{"id": "EA:AS184", "title": "Create a simple picture graph from data", "desc": "Represent data visually using symbols or pictures where each symbol stands for one or more units."},
{"id": "EA:AS185", "title": "Create a simple bar graph from data (with scaled intervals)", "desc": "Represent data using rectangular bars of lengths proportional to the values they represent, possibly with a scale."},
{"id": "EA:AS186", "title": "Create a line plot to represent measurement data", "desc": "Display data frequencies along a number line using X's or dots over corresponding values."},
{"id": "EA:AS187", "title": "Read and interpret data from a picture graph", "desc": "Understand and extract information presented in a picture graph, including using a key."},
{"id": "EA:AS188", "title": "Read and interpret data from a bar graph", "desc": "Understand and extract information from a bar graph, including comparing bar lengths and reading scales."},
{"id": "EA:AS189", "title": "Read and interpret data from a line plot", "desc": "Understand and extract information from a line plot, including finding most frequent values or range."},
{"id": "EA:AS190", "title": "Solve simple problems using information presented in graphs", "desc": "Answer questions (e.g., 'how many more', 'total') based on data shown in picture graphs, bar graphs, or line plots."},
{"id": "EA:AS191", "title": "Identify steps for two-step word problems (add/sub)", "desc": "Determine the sequence of two operations (addition and/or subtraction) needed to solve a story problem."},
{"id": "EA:AS192", "title": "Solve two-step word problems (add/sub)", "desc": "Perform the necessary calculations to find the solution to two-step story problems involving + or -."},
{"id": "EA:AS193", "title": "Identify steps for two-step word problems (mult/div with others)", "desc": "Determine sequence of two operations (mult/div with add/sub) needed to solve a story problem."},
{"id": "EA:AS194", "title": "Solve two-step word problems (mult/div with others)", "desc": "Perform calculations for two-step story problems involving x, ÷, +, or -."},
{"id": "EA:AS195", "title": "Choose the correct operation(s) for a word problem", "desc": "Analyze a word problem to select the appropriate arithmetic operation(s) to find the solution."}
]

topics = {
"EA:T001": ["EA:AS001", "EA:AS002", "EA:AS003", "EA:AS004", "EA:AS005", "EA:AS006", "EA:AS007", "EA:AS008", "EA:AS009"],
"EA:T002": ["EA:AS010", "EA:AS011", "EA:AS012", "EA:AS013", "EA:AS014", "EA:AS015", "EA:AS016", "EA:AS017"],
"EA:T003": ["EA:AS018", "EA:AS019", "EA:AS020", "EA:AS021", "EA:AS022", "EA:AS023", "EA:AS024", "EA:AS025"],
"EA:T004": ["EA:AS026", "EA:AS027", "EA:AS028", "EA:AS029", "EA:AS030", "EA:AS031", "EA:AS032"],
"EA:T005": ["EA:AS033", "EA:AS034", "EA:AS035", "EA:AS036", "EA:AS037", "EA:AS038", "EA:AS039"],
"EA:T006": ["EA:AS040", "EA:AS041", "EA:AS042", "EA:AS043", "EA:AS044", "EA:AS045", "EA:AS046"],
"EA:T007": ["EA:AS047", "EA:AS048", "EA:AS049", "EA:AS050", "EA:AS051", "EA:AS052", "EA:AS053", "EA:AS054"],
"EA:T008": ["EA:AS055", "EA:AS056", "EA:AS057", "EA:AS058", "EA:AS059", "EA:AS060", "EA:AS061", "EA:AS062"],
"EA:T009": ["EA:AS063", "EA:AS064", "EA:AS065", "EA:AS066", "EA:AS067", "EA:AS068"],
"EA:T010": ["EA:AS069", "EA:AS070", "EA:AS071", "EA:AS072", "EA:AS073", "EA:AS074", "EA:AS075", "EA:AS076"],
"EA:T011": ["EA:AS077", "EA:AS078", "EA:AS079", "EA:AS080", "EA:AS081", "EA:AS082", "EA:AS083", "EA:AS084", "EA:AS085", "EA:AS086"],
"EA:T012": ["EA:AS087", "EA:AS088", "EA:AS089", "EA:AS090", "EA:AS091"],
"EA:T013": ["EA:AS092", "EA:AS093", "EA:AS094", "EA:AS095", "EA:AS096", "EA:AS097"],
"EA:T014": ["EA:AS098", "EA:AS099", "EA:AS100", "EA:AS101"],
"EA:T015": ["EA:AS102", "EA:AS103", "EA:AS104", "EA:AS105", "EA:AS106", "EA:AS107"],
"EA:T016": ["EA:AS108", "EA:AS109", "EA:AS110", "EA:AS111", "EA:AS112", "EA:AS113"],
"EA:T017": ["EA:AS114", "EA:AS115", "EA:AS116"],
"EA:T018": ["EA:AS117", "EA:AS118", "EA:AS119", "EA:AS120", "EA:AS121"],
"EA:T019": ["EA:AS122", "EA:AS123", "EA:AS124", "EA:AS125", "EA:AS126", "EA:AS127", "EA:AS128"],
"EA:T020": ["EA:AS129", "EA:AS130", "EA:AS131", "EA:AS132"],
"EA:T021": ["EA:AS133", "EA:AS134", "EA:AS135", "EA:AS136", "EA:AS137", "EA:AS138", "EA:AS139", "EA:AS140"],
"EA:T022": ["EA:AS141", "EA:AS142", "EA:AS143", "EA:AS144"],
"EA:T023": ["EA:AS145", "EA:AS146", "EA:AS147", "EA:AS148"],
"EA:T024": ["EA:AS149", "EA:AS150", "EA:AS151", "EA:AS152", "EA:AS153", "EA:AS154", "EA:AS155"],
"EA:T025": ["EA:AS156", "EA:AS157", "EA:AS158", "EA:AS159"],
"EA:T026": ["EA:AS160", "EA:AS161", "EA:AS162", "EA:AS163"],
"EA:T027": ["EA:AS164", "EA:AS165", "EA:AS166"],
"EA:T028": ["EA:AS167", "EA:AS168"],
"EA:T029": ["EA:AS169", "EA:AS170", "EA:AS171", "EA:AS172", "EA:AS173"],
"EA:T030": ["EA:AS174", "EA:AS175", "EA:AS176", "EA:AS177", "EA:AS178"],
"EA:T031": ["EA:AS179", "EA:AS180", "EA:AS181"],
"EA:T032": ["EA:AS182", "EA:AS183", "EA:AS184", "EA:AS185", "EA:AS186"],
"EA:T033": ["EA:AS187", "EA:AS188", "EA:AS189", "EA:AS190"],
"EA:T034": ["EA:AS191", "EA:AS192", "EA:AS193", "EA:AS194", "EA:AS195"]
}

edges = """
EA:AS001,EA:AS004,1.0
EA:AS003,EA:AS004,1.0
EA:AS004,EA:AS005,1.0
EA:AS004,EA:AS006,1.0
EA:AS006,EA:AS009,1.0
EA:AS006,EA:AS007,1.0
EA:AS004,EA:AS010,1.0
EA:AS001,EA:AS013,1.0
EA:AS010,EA:AS011,1.0
EA:AS013,EA:AS011,1.0
EA:AS011,EA:AS012,1.0
EA:AS011,EA:AS015,1.0
EA:AS011,EA:AS016,1.0
EA:AS011,EA:AS017,1.0
EA:AS012,EA:AS014,1.0
EA:AS004,EA:AS018,1.0
EA:AS001,EA:AS021,1.0
EA:AS018,EA:AS019,1.0
EA:AS021,EA:AS019,1.0
EA:AS019,EA:AS020,1.0
EA:AS019,EA:AS024,1.0
EA:AS019,EA:AS025,1.0
EA:AS020,EA:AS022,1.0
EA:AS011,EA:AS023,1.0
EA:AS019,EA:AS023,1.0
EA:AS001,EA:AS026,1.0
EA:AS006,EA:AS026,1.0
EA:AS026,EA:AS027,1.0
EA:AS026,EA:AS029,1.0
EA:AS029,EA:AS028,1.0
EA:AS029,EA:AS030,1.0
EA:AS030,EA:AS031,1.0
EA:AS030,EA:AS032,1.0
EA:AS012,EA:AS033,1.0
EA:AS029,EA:AS033,1.0
EA:AS033,EA:AS034,1.0
EA:AS012,EA:AS035,1.0
EA:AS029,EA:AS035,1.0
EA:AS035,EA:AS036,1.0
EA:AS034,EA:AS036,1.0
EA:AS036,EA:AS037,1.0
EA:AS036,EA:AS038,1.0
EA:AS030,EA:AS038,1.0
EA:AS038,EA:AS039,1.0
EA:AS020,EA:AS040,1.0
EA:AS029,EA:AS040,1.0
EA:AS040,EA:AS041,1.0
EA:AS020,EA:AS042,1.0
EA:AS029,EA:AS042,1.0
EA:AS042,EA:AS043,1.0
EA:AS041,EA:AS043,1.0
EA:AS043,EA:AS044,1.0
EA:AS030,EA:AS044,1.0
EA:AS044,EA:AS045,1.0
EA:AS044,EA:AS046,1.0
EA:AS011,EA:AS047,1.0
EA:AS047,EA:AS050,1.0
EA:AS048,EA:AS050,1.0
EA:AS001,EA:AS049,1.0
EA:AS049,EA:AS050,1.0
EA:AS050,EA:AS051,1.0
EA:AS050,EA:AS052,1.0
EA:AS050,EA:AS053,1.0
EA:AS050,EA:AS054,1.0
EA:AS029,EA:AS054,1.0
EA:AS019,EA:AS056,1.0
EA:AS055,EA:AS059,1.0
EA:AS056,EA:AS059,1.0
EA:AS001,EA:AS057,1.0
EA:AS057,EA:AS059,1.0
EA:AS050,EA:AS058,1.0
EA:AS058,EA:AS059,1.0
EA:AS059,EA:AS060,1.0
EA:AS059,EA:AS061,1.0
EA:AS059,EA:AS062,1.0
EA:AS004,EA:AS063,1.0
EA:AS055,EA:AS063,1.0
EA:AS063,EA:AS064,1.0
EA:AS063,EA:AS065,1.0
EA:AS064,EA:AS065,1.0
EA:AS065,EA:AS066,1.0
EA:AS065,EA:AS067,1.0
EA:AS009,EA:AS068,1.0
EA:AS063,EA:AS068,1.0
EA:AS005,EA:AS069,1.0
EA:AS004,EA:AS070,1.0
EA:AS070,EA:AS071,1.0
EA:AS006,EA:AS071,1.0
EA:AS005,EA:AS072,1.0
EA:AS001,EA:AS073,1.0
EA:AS006,EA:AS073,1.0
EA:AS073,EA:AS074,1.0
EA:AS001,EA:AS075,1.0
EA:AS011,EA:AS076,1.0
EA:AS026,EA:AS076,1.0
EA:AS026,EA:AS077,1.0
EA:AS029,EA:AS077,1.0
EA:AS030,EA:AS078,1.0
EA:AS029,EA:AS078,1.0
EA:AS030,EA:AS079,1.0
EA:AS077,EA:AS080,1.0
EA:AS036,EA:AS080,1.0
EA:AS078,EA:AS081,1.0
EA:AS038,EA:AS081,1.0
EA:AS077,EA:AS082,1.0
EA:AS043,EA:AS082,1.0
EA:AS078,EA:AS083,1.0
EA:AS044,EA:AS083,1.0
EA:AS080,EA:AS084,1.0
EA:AS082,EA:AS084,1.0
EA:AS036,EA:AS084,1.0
EA:AS043,EA:AS084,1.0
EA:AS077,EA:AS085,1.0
EA:AS078,EA:AS085,1.0
EA:AS050,EA:AS085,1.0
EA:AS059,EA:AS086,1.0
EA:AS050,EA:AS086,1.0
EA:AS011,EA:AS087,1.0
EA:AS015,EA:AS087,1.0
EA:AS050,EA:AS088,1.0
EA:AS051,EA:AS088,1.0
EA:AS050,EA:AS089,1.0
EA:AS011,EA:AS089,1.0
EA:AS052,EA:AS090,1.0
EA:AS016,EA:AS091,1.0
EA:AS059,EA:AS092,1.0
EA:AS050,EA:AS092,1.0
EA:AS050,EA:AS093,1.0
EA:AS093,EA:AS094,1.0
EA:AS059,EA:AS094,1.0
EA:AS092,EA:AS095,1.0
EA:AS093,EA:AS096,1.0
EA:AS092,EA:AS097,1.0
EA:AS050,EA:AS098,1.0
EA:AS035,EA:AS098,1.0
EA:AS029,EA:AS098,1.0
EA:AS098,EA:AS099,1.0
EA:AS030,EA:AS099,1.0
EA:AS098,EA:AS100,1.0
EA:AS036,EA:AS100,1.0
EA:AS100,EA:AS101,1.0
EA:AS053,EA:AS101,1.0
EA:AS059,EA:AS102,1.0
EA:AS019,EA:AS102,1.0
EA:AS102,EA:AS103,1.0
EA:AS062,EA:AS103,1.0
EA:AS059,EA:AS104,1.0
EA:AS029,EA:AS104,1.0
EA:AS050,EA:AS104,1.0
EA:AS040,EA:AS104,1.0
EA:AS104,EA:AS105,1.0
EA:AS102,EA:AS105,1.0
EA:AS105,EA:AS106,1.0
EA:AS030,EA:AS106,1.0
EA:AS103,EA:AS107,1.0
EA:AS105,EA:AS107,1.0
EA:AS065,EA:AS108,1.0
EA:AS065,EA:AS109,1.0
EA:AS066,EA:AS109,1.0
EA:AS063,EA:AS110,1.0
EA:AS064,EA:AS110,1.0
EA:AS065,EA:AS110,1.0
EA:AS093,EA:AS111,1.0
EA:AS065,EA:AS111,1.0
EA:AS109,EA:AS112,1.0
EA:AS108,EA:AS112,1.0
EA:AS111,EA:AS112,1.0
EA:AS114,EA:AS112,1.0
EA:AS112,EA:AS113,1.0
EA:AS065,EA:AS114,1.0
EA:AS050,EA:AS114,1.0
EA:AS067,EA:AS114,1.0
EA:AS065,EA:AS115,1.0
EA:AS059,EA:AS115,1.0
EA:AS092,EA:AS115,1.0
EA:AS115,EA:AS116,1.0
EA:AS095,EA:AS116,1.0
EA:AS064,EA:AS117,1.0
EA:AS065,EA:AS117,1.0
EA:AS064,EA:AS118,1.0
EA:AS004,EA:AS118,1.0
EA:AS117,EA:AS119,1.0
EA:AS059,EA:AS119,1.0
EA:AS118,EA:AS120,1.0
EA:AS050,EA:AS120,1.0
EA:AS011,EA:AS120,1.0
EA:AS068,EA:AS121,1.0
EA:AS117,EA:AS121,1.0
EA:AS118,EA:AS121,1.0
EA:AS064,EA:AS122,1.0
EA:AS011,EA:AS122,1.0
EA:AS065,EA:AS122,1.0
EA:AS064,EA:AS123,1.0
EA:AS019,EA:AS123,1.0
EA:AS065,EA:AS123,1.0
EA:AS122,EA:AS124,1.0
EA:AS111,EA:AS124,1.0
EA:AS114,EA:AS124,1.0
EA:AS123,EA:AS125,1.0
EA:AS111,EA:AS125,1.0
EA:AS114,EA:AS125,1.0
EA:AS118,EA:AS126,1.0
EA:AS122,EA:AS126,1.0
EA:AS011,EA:AS126,1.0
EA:AS118,EA:AS127,1.0
EA:AS123,EA:AS127,1.0
EA:AS019,EA:AS127,1.0
EA:AS122,EA:AS128,1.0
EA:AS123,EA:AS128,1.0
EA:AS014,EA:AS128,1.0
EA:AS022,EA:AS128,1.0
EA:AS047,EA:AS129,1.0
EA:AS063,EA:AS129,1.0
EA:AS122,EA:AS129,1.0
EA:AS129,EA:AS130,1.0
EA:AS050,EA:AS130,1.0
EA:AS130,EA:AS131,1.0
EA:AS064,EA:AS131,1.0
EA:AS131,EA:AS132,1.0
EA:AS053,EA:AS132,1.0
EA:AS063,EA:AS133,1.0
EA:AS029,EA:AS133,1.0
EA:AS133,EA:AS134,1.0
EA:AS030,EA:AS134,1.0
EA:AS001,EA:AS135,1.0
EA:AS133,EA:AS135,1.0
EA:AS135,EA:AS136,1.0
EA:AS134,EA:AS136,1.0
EA:AS133,EA:AS137,1.0
EA:AS135,EA:AS137,1.0
EA:AS134,EA:AS138,1.0
EA:AS136,EA:AS138,1.0
EA:AS029,EA:AS139,1.0
EA:AS137,EA:AS139,1.0
EA:AS138,EA:AS139,1.0
EA:AS027,EA:AS140,1.0
EA:AS137,EA:AS140,1.0
EA:AS138,EA:AS140,1.0
EA:AS139,EA:AS141,1.0
EA:AS005,EA:AS141,1.0
EA:AS141,EA:AS142,1.0
EA:AS142,EA:AS143,1.0
EA:AS009,EA:AS143,1.0
EA:AS075,EA:AS144,1.0
EA:AS138,EA:AS144,1.0
EA:AS136,EA:AS144,1.0
EA:AS137,EA:AS145,1.0
EA:AS011,EA:AS145,1.0
EA:AS139,EA:AS145,1.0
EA:AS138,EA:AS146,1.0
EA:AS033,EA:AS146,1.0
EA:AS139,EA:AS146,1.0
EA:AS137,EA:AS147,1.0
EA:AS019,EA:AS147,1.0
EA:AS139,EA:AS147,1.0
EA:AS138,EA:AS148,1.0
EA:AS040,EA:AS148,1.0
EA:AS139,EA:AS148,1.0
EA:AS074,EA:AS149,1.0
EA:AS006,EA:AS149,1.0
EA:AS149,EA:AS150,1.0
EA:AS073,EA:AS151,1.0
EA:AS073,EA:AS152,1.0
EA:AS004,EA:AS152,1.0
EA:AS150,EA:AS153,1.0
EA:AS006,EA:AS153,1.0
EA:AS007,EA:AS153,1.0
EA:AS150,EA:AS154,1.0
EA:AS154,EA:AS155,1.0
EA:AS050,EA:AS155,1.0
EA:AS059,EA:AS155,1.0
EA:AS076,EA:AS156,1.0
EA:AS075,EA:AS156,1.0
EA:AS156,EA:AS157,1.0
EA:AS019,EA:AS157,1.0
EA:AS043,EA:AS157,1.0
EA:AS146,EA:AS158,1.0
EA:AS148,EA:AS158,1.0
EA:AS014,EA:AS158,1.0
EA:AS022,EA:AS158,1.0
EA:AS136,EA:AS159,1.0
EA:AS075,EA:AS159,1.0
EA:AS005,EA:AS160,1.0
EA:AS004,EA:AS161,1.0
EA:AS160,EA:AS161,1.0
EA:AS161,EA:AS162,1.0
EA:AS162,EA:AS163,1.0
EA:AS005,EA:AS163,1.0
EA:AS072,EA:AS164,1.0
EA:AS004,EA:AS164,1.0
EA:AS164,EA:AS165,1.0
EA:AS165,EA:AS166,1.0
EA:AS005,EA:AS166,1.0
EA:AS005,EA:AS167,1.0
EA:AS167,EA:AS168,1.0
EA:AS006,EA:AS168,1.0
EA:AS001,EA:AS168,1.0
EA:AS069,EA:AS169,1.0
EA:AS169,EA:AS170,1.0
EA:AS011,EA:AS170,1.0
EA:AS037,EA:AS170,1.0
EA:AS071,EA:AS170,1.0
EA:AS004,EA:AS171,1.0
EA:AS171,EA:AS172,1.0
EA:AS004,EA:AS172,1.0
EA:AS172,EA:AS173,1.0
EA:AS050,EA:AS173,1.0
EA:AS001,EA:AS174,1.0
EA:AS174,EA:AS175,1.0
EA:AS004,EA:AS175,1.0
EA:AS175,EA:AS176,1.0
EA:AS174,EA:AS177,1.0
EA:AS177,EA:AS178,1.0
EA:AS001,EA:AS179,1.0
EA:AS179,EA:AS180,1.0
EA:AS004,EA:AS180,1.0
EA:AS174,EA:AS181,1.0
EA:AS179,EA:AS181,1.0
EA:AS004,EA:AS182,1.0
EA:AS182,EA:AS183,1.0
EA:AS004,EA:AS183,1.0
EA:AS183,EA:AS184,1.0
EA:AS004,EA:AS184,1.0
EA:AS183,EA:AS185,1.0
EA:AS006,EA:AS185,1.0
EA:AS071,EA:AS186,1.0
EA:AS183,EA:AS186,1.0
EA:AS009,EA:AS186,1.0
EA:AS184,EA:AS187,1.0
EA:AS185,EA:AS188,1.0
EA:AS186,EA:AS189,1.0
EA:AS187,EA:AS190,1.0
EA:AS188,EA:AS190,1.0
EA:AS189,EA:AS190,1.0
EA:AS014,EA:AS190,1.0
EA:AS022,EA:AS190,1.0
EA:AS014,EA:AS191,1.0
EA:AS022,EA:AS191,1.0
EA:AS191,EA:AS192,1.0
EA:AS039,EA:AS192,1.0
EA:AS046,EA:AS192,1.0
EA:AS053,EA:AS193,1.0
EA:AS062,EA:AS193,1.0
EA:AS192,EA:AS193,1.0
EA:AS193,EA:AS194,1.0
EA:AS101,EA:AS194,1.0
EA:AS107,EA:AS194,1.0
"""

root_topics = ["EA:T001"]

# Build prereq map
prereq_map = {}
for line in edges.strip().splitlines():
    src, dst, weight = line.split(',')
    prereq_map.setdefault(dst, []).append({'id': src, 'weight': float(weight)})

base = 'course/EA'
os.makedirs(f'{base}/skills', exist_ok=True)
os.makedirs(f'{base}/as_md', exist_ok=True)
os.makedirs(f'{base}/as_questions', exist_ok=True)
os.makedirs(f'{base}/topics', exist_ok=True)

skill_files = []
for s in skills:
    fname = s['id'].replace(':','_')+'.json'
    skill_files.append(fname)
    data = {
        'id': s['id'],
        'title': s['title'],
        'desc': s['desc'],
        'prereqs': prereq_map.get(s['id'], []),
        'xp': 1
    }
    with open(f'{base}/skills/{fname}', 'w') as f:
        json.dump(data, f, indent=2)
    with open(f'{base}/as_md/{fname[:-5]}.md', 'w') as f:
        f.write(f"# {s['title']}\n\n{s['desc']}\n")
    with open(f'{base}/as_questions/{fname[:-5]}.yaml', 'w') as f:
        f.write(f"format: ASQ-v1\nid: {s['id']}\npool:\n  - id: q1\n    stem: |\n      {s['desc']}\n    choices: ['OK']\n    correct: 0\n")

# Topics
topic_files = []
for tid, ass in topics.items():
    tname = tid.replace(':','_')+'.json'
    topic_files.append(tname)
    data = {'id': tid, 'name': '', 'ass': ass}
    with open(f'{base}/topics/{tname}', 'w') as f:
        json.dump(data, f, indent=2)

# Update catalog
catalog = {
    'format': 'Catalog-v1',
    'course_id': 'EA',
    'title': 'Elementary Arithmetic',
    'root_topics': root_topics,
    'topic_files': topic_files,
    'skill_files': skill_files
}
with open(f'{base}/catalog.json','w') as f:
    json.dump(catalog, f, indent=2)
