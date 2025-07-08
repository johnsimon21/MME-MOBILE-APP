import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { FormData2 } from "@/src/interfaces/auth.interface";
import { Grade, School, UserRole } from "@/src/interfaces/index.interface";
import { Picker } from "@react-native-picker/picker";

interface Form2Props {
  onChange: (field: keyof FormData2, value: string | number) => void;
  setConfirmPassword: (value: string) => void;
  role: UserRole;
}

const Form2: React.FC<Form2Props> = ({ onChange, setConfirmPassword, role }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPass] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const schoolOptions = [
    { title: "Caxito", value: "CAXITO" },
    { title: "Malanje", value: "MALANJE" },
    { title: "Ndalatando", value: "NDALATANDO" },
    { title: "Ondjiva", value: "ONDJIVA" }
  ];

  const gradeOptions = [
    { title: "10ª Classe", value: "10" },
    { title: "11ª Classe", value: "11" },
    { title: "12ª Classe", value: "12" }
  ];

  // Angola Provinces and Municipalities
  const provinceOptions = [
    { title: "Bengo", value: "BENGO" },
    { title: "Benguela", value: "BENGUELA" },
    { title: "Bié", value: "BIE" },
    { title: "Cabinda", value: "CABINDA" },
    { title: "Cuando Cubango", value: "CUANDO_CUBANGO" },
    { title: "Cuanza Norte", value: "CUANZA_NORTE" },
    { title: "Cuanza Sul", value: "CUANZA_SUL" },
    { title: "Cunene", value: "CUNENE" },
    { title: "Huambo", value: "HUAMBO" },
    { title: "Huíla", value: "HUILA" },
    { title: "Luanda", value: "LUANDA" },
    { title: "Lunda Norte", value: "LUNDA_NORTE" },
    { title: "Lunda Sul", value: "LUNDA_SUL" },
    { title: "Malanje", value: "MALANJE" },
    { title: "Moxico", value: "MOXICO" },
    { title: "Namibe", value: "NAMIBE" },
    { title: "Uíge", value: "UIGE" },
    { title: "Zaire", value: "ZAIRE" }
  ];

  const municipalityOptions: { [key: string]: { title: string; value: string }[] } = {
    BENGO: [
      { title: "Ambriz", value: "AMBRIZ" },
      { title: "Bula Atumba", value: "BULA_ATUMBA" },
      { title: "Dande", value: "DANDE" },
      { title: "Dembos", value: "DEMBOS" },
      { title: "Nambuangongo", value: "NAMBUANGONGO" },
      { title: "Pango Aluquém", value: "PANGO_ALUQUEM" }
    ],
    BENGUELA: [
      { title: "Balombo", value: "BALOMBO" },
      { title: "Baía Farta", value: "BAIA_FARTA" },
      { title: "Benguela", value: "BENGUELA_CITY" },
      { title: "Bocoio", value: "BOCOIO" },
      { title: "Caimbambo", value: "CAIMBAMBO" },
      { title: "Catumbela", value: "CATUMBELA" },
      { title: "Chongorói", value: "CHONGOROI" },
      { title: "Cubal", value: "CUBAL" },
      { title: "Ganda", value: "GANDA" },
      { title: "Lobito", value: "LOBITO" }
    ],
    LUANDA: [
      { title: "Belas", value: "BELAS" },
      { title: "Cacuaco", value: "CACUACO" },
      { title: "Cazenga", value: "CAZENGA" },
      { title: "Ícolo e Bengo", value: "ICOLO_E_BENGO" },
      { title: "Kilamba Kiaxi", value: "KILAMBA_KIAXI" },
      { title: "Luanda", value: "LUANDA_CITY" },
      { title: "Quiçama", value: "QUICAMA" },
      { title: "Talatona", value: "TALATONA" },
      { title: "Viana", value: "VIANA" }
    ],
  };

  const handleGenerationYear = () => {
    const years: string[] = [];
    const minYearBefore = 3;
    const maxYearBefore = 10;
    const currentYear = new Date().getFullYear();

    for (let i = minYearBefore; i < maxYearBefore; i++) {
      const year = currentYear - i;
      years.push(year.toString());
    }
    return years;
  };

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    onChange("province", province);
    onChange("municipality", "");
    if (errors.province) {
      setErrors(prev => ({ ...prev, province: '' }));
    }
  };

  const getCurrentMunicipalities = () => {
    return selectedProvince ? municipalityOptions[selectedProvince] || [] : [];
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    onChange("password", text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPass(text);
    setConfirmPassword(text);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const getInputStyle = (fieldName: string) => [
    tw`flex-row items-center bg-white rounded-xl px-4 py-2 border`,
    errors[fieldName] ? tw`border-red-300` : tw`border-gray-200`
  ];

  const getPickerStyle = (fieldName: string) => [
    tw`bg-white rounded-xl border`,
    errors[fieldName] ? tw`border-red-300` : tw`border-gray-200`
  ];

  return (
    <View style={tw`w-full`}>
      {/* School Picker */}
      <View style={tw`mb-4`}>
        <Text style={tw`text-gray-700 font-medium mb-2`}>
          {role === UserRole.MENTEE ? "Liceu *" : "Liceu que frequentou *"}
        </Text>
        <View style={getPickerStyle('school')}>
          <View style={tw`flex-row items-center px-4 py-1`}>
            <Ionicons name="school-outline" size={20} color="#9CA3AF" />
            <View style={tw`flex-1 ml-3`}>
              <Picker
                selectedValue={undefined}
                style={tw`text-gray-900`}
                onValueChange={(value: School) => onChange("school", value)}
              >
                <Picker.Item
                  label={role === UserRole.MENTEE ? "Selecione o Liceu" : "Selecione o Liceu que frequentou"}
                  value=""
                  color="#9CA3AF"
                />
                {schoolOptions.map((option, index) => (
                  <Picker.Item
                    key={index}
                    label={option.title}
                    value={option.value}
                    color="#374151"
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
        {errors.school && (
          <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
            {errors.school}
          </Text>
        )}
      </View>

      {/* Grade or Year Picker */}
      {role === UserRole.MENTEE ? (
        <View style={tw`mb-4`}>
          <Text style={tw`text-gray-700 font-medium mb-2`}>Classe *</Text>
          <View style={getPickerStyle('grade')}>
            <View style={tw`flex-row items-center px-4 py-1`}>
              <Ionicons name="library-outline" size={20} color="#9CA3AF" />
              <View style={tw`flex-1 ml-3`}>
                <Picker
                  selectedValue={undefined}
                  style={tw`text-gray-900`}
                  onValueChange={(value: Grade) => onChange("grade", value)}
                >
                  <Picker.Item label="Selecione a Classe" value="" color="#9CA3AF" />
                  {gradeOptions.map((option, index) => (
                    <Picker.Item
                      key={index}
                      label={option.title}
                      value={option.value}
                      color="#374151"
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          {errors.grade && (
            <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
              {errors.grade}
            </Text>
          )}
        </View>
      ) : (
        <View style={tw`mb-4`}>
          <Text style={tw`text-gray-700 font-medium mb-2`}>Ano de Conclusão *</Text>
          <View style={getPickerStyle('schoolYear')}>
            <View style={tw`flex-row items-center px-4 py-1`}>
              <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
              <View style={tw`flex-1 ml-3`}>
                <Picker
                  selectedValue={undefined}
                  style={tw`text-gray-900`}
                  onValueChange={(value: string) => onChange("schoolYear", value)}
                >
                  <Picker.Item
                    label="Selecione o ano de conclusão"
                    value={undefined}
                    color="#9CA3AF"
                  />
                  {handleGenerationYear().map((year, index) => (
                    <Picker.Item
                      key={index}
                      label={year.toString()}
                      value={year}
                      color="#374151"
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          {errors.schoolYear && (
            <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
              {errors.schoolYear}
            </Text>
          )}
        </View>
      )}

      {/* Province Picker */}
      <View style={tw`mb-4`}>
        <Text style={tw`text-gray-700 font-medium mb-2`}>Província *</Text>
        <View style={getPickerStyle('province')}>
          <View style={tw`flex-row items-center px-4 py-1`}>
            <Ionicons name="location-outline" size={20} color="#9CA3AF" />
            <View style={tw`flex-1 ml-3`}>
              <Picker
                selectedValue={selectedProvince}
                style={tw`text-gray-900`}
                onValueChange={(value: string) => handleProvinceChange(value)}
              >
                <Picker.Item label="Selecione a Província" value="" color="#9CA3AF" />
                {provinceOptions.map((option, index) => (
                  <Picker.Item
                    key={index}
                    label={option.title}
                    value={option.value}
                    color="#374151"
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
        {errors.province && (
          <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
            {errors.province}
          </Text>
        )}
      </View>

      {/* Municipality Picker */}
      <View style={tw`mb-4`}>
        <Text style={tw`text-gray-700 font-medium mb-2`}>Município *</Text>
        <View style={[getPickerStyle('municipality'), !selectedProvince && tw`opacity-50`]}>
          <View style={tw`flex-row items-center px-4 py-1`}>
            <Ionicons name="business-outline" size={20} color="#9CA3AF" />
            <View style={tw`flex-1 ml-3`}>
              <Picker
                selectedValue={undefined}
                style={tw`text-gray-900`}
                onValueChange={(value: string) => onChange("municipality", value)}
                enabled={selectedProvince !== ""}
              >
                <Picker.Item
                  label={selectedProvince ? "Selecione o Município" : "Primeiro selecione uma província"}
                  value=""
                  color="#9CA3AF"
                />
                {getCurrentMunicipalities().map((option, index) => (
                  <Picker.Item
                    key={index}
                    label={option.title}
                    value={option.title}
                    color="#374151"
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
        {errors.municipality && (
          <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
            {errors.municipality}
          </Text>
        )}
      </View>

      {/* Max mentee number input */}
      {role !== UserRole.MENTEE && (
        <View style={tw`mb-4`}>
          <Text style={tw`text-gray-700 font-medium mb-2`}>Número máximo de mentorados *</Text>
          <View style={getInputStyle('maxMenteeNumber')}>
            <Ionicons name="people-outline" size={20} color="#9CA3AF" />
            <TextInput
              keyboardType="numeric"
              style={tw`flex-1 ml-3 text-gray-900 text-base`}
              placeholder="Ex: 15"
              defaultValue="15"
              onChangeText={(text: string) => onChange("maxMenteeNumber", parseInt(text) || 15)}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {errors.maxMenteeNumber && (
            <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
              {errors.maxMenteeNumber}
            </Text>
          )}
        </View>
      )}

      {/* Password input */}
      <View style={tw`mb-4`}>
        <Text style={tw`text-gray-700 font-medium mb-2`}>Senha *</Text>
        <View style={getInputStyle('password')}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
          <TextInput
            secureTextEntry={!showPassword}
            style={tw`flex-1 ml-3 text-gray-900 text-base`}
            placeholder="Digite sua senha"
            value={password}
            onChangeText={handlePasswordChange}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={tw`p-1`}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
            {errors.password}
          </Text>
        )}
      </View>

      {/* Confirm password input */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-gray-700 font-medium mb-2`}>Confirmar Senha *</Text>
        <View style={getInputStyle('confirmPassword')}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
          <TextInput
            secureTextEntry={!showConfirmPassword}
            style={tw`flex-1 ml-3 text-gray-900 text-base`}
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={tw`p-1`}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
            {errors.confirmPassword}
          </Text>
        )}
      </View>

      {/* Password Requirements */}
      <View style={tw`bg-gray-50 rounded-xl p-4 mb-4`}>
        <Text style={tw`text-gray-700 font-medium mb-2`}>Requisitos da senha:</Text>
        <View style={tw`space-y-1`}>
          <View style={tw`flex-row items-center`}>
            <Ionicons
              name={password.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={password.length >= 6 ? "#10B981" : "#9CA3AF"}
            />
            <Text style={[
              tw`ml-2 text-sm`,
              password.length >= 6 ? tw`text-green-600` : tw`text-gray-600`
            ]}>
              Pelo menos 6 caracteres
            </Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <Ionicons
              name={password === confirmPassword && password.length > 0 ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={password === confirmPassword && password.length > 0 ? "#10B981" : "#9CA3AF"}
            />
            <Text style={[
              tw`ml-2 text-sm`,
              password === confirmPassword && password.length > 0 ? tw`text-green-600` : tw`text-gray-600`
            ]}>
              Senhas coincidem
            </Text>
          </View>
        </View>
      </View>

      {/* Info Box */}
      <View style={tw`bg-blue-50 rounded-xl p-4 flex-row items-start`}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#3B82F6" style={tw`mr-3 mt-0.5`} />
        <Text style={tw`text-blue-800 text-sm leading-5 flex-1`}>
          Suas informações são criptografadas e mantidas em segurança. Você pode alterar esses dados posteriormente.
        </Text>
      </View>
    </View>
  );
};

export default Form2;
